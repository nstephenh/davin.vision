import React, {useState, useCallback} from 'react';
import './App.css';
import Datasheet, {fos, iUnit} from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';
import {parse} from 'arraybuffer-xml-parser';
import {ActionButton, Checkbox, Spinner, SpinnerSize} from "@fluentui/react";

const fs = new FS('fs')

interface IBSEntry {
    bs_id: string

}

export interface IUnitEntry extends IBSEntry {
    name: string
    raw_data: any
    unit?: iUnit;
}

export interface IRule extends IBSEntry {
    name: string;
    description: any;
}

interface IDoubleEntry<entryType> extends IBSEntry {
    a?: entryType;
    b?: entryType;
}


function App() {
    const [unitList, setUnitList] = useState(Array<IDoubleEntry<IUnitEntry>>())
    const [ruleList, setRuleList] = useState(Array<IDoubleEntry<IRule>>())
    const [dataLoading, setDataLoading] = useState(false)


    const [sourceA, setSourceA] = useState("https://github.com/BSData/horus-heresy/")
    const [sourceB, setSourceB] = useState("https://github.com/nstephenh/panoptica-heresy/")
    const [showA, setShowA] = useState(true)
    const [showB, setShowB] = useState(true)
    //const [onlyDiffs, setOnlyDiffs] = useState(false)
    const [highlightDiffs, setHighlightDiffs] = useState(true)


    function LoadFromGithub(source: string, useB: boolean) {
        const path = useB ? "/srcB" : "/srcA";
        git.clone({
            fs,
            http,
            dir: path,
            corsProxy: 'https://cors.isomorphic-git.org',
            url: source,
            singleBranch: true,
            depth: 1
        }).then(() => {
            console.log("Checked out data from ", source)
            fs.promises.readdir(path).then((filenames: string[]) => {
                filenames.map((filename: string) => {
                    runOnFile(filename, useB, GetSelectionEntries)
                    runOnFile(filename, useB, GetForceSlots)
                    runOnFile(filename, useB, GetRules)
                })
            })
        });
    }

    const loadData = useCallback(() => {
        setDataLoading(true)
        //Will be called twice in dev. Annoying strict mode thing.
        // @ts-ignore
        LoadFromGithub(sourceA, false);
        LoadFromGithub(sourceB, true)
    }, [sourceA, sourceB])

    function runOnFile(filename: string, useB: boolean, action: (cat: any, useB: boolean) => void) {
        const extension = filename.split(".").pop()
        if (extension && ['cat', 'gst'].indexOf(extension) == 0) {
            //console.log("Is battlescribe file: ", filename);
            const path = useB ? "/srcB/" : "/srcA/";
            fs.promises.readFile(path + filename).then((content) => {
                const jObj = parse((content as Uint8Array).buffer as Buffer);
                const cat = (jObj as Record<string, any>)["catalogue"]
                if (cat["$gameSystemId"] == "28d4-bd2e-4858-ece6" || cat["$gameSystemId"] == "28d4-bd2e-4858-ece7") {
                    //console.log("Valid 2.0 cat")
                    action(cat, useB)
                } else {
                    //console.log("Not a 2.0 cat")
                }
            })
        }
    }

    function getDoubleEntry<entryType extends IBSEntry>(entryList: Array<IDoubleEntry<entryType>>, entryId: string): IDoubleEntry<entryType> | null {
        let entry = null;
        if (entryList.some((oldEntry) => {
            entry = oldEntry; //go through each old entry, find the first one that matches ID
            return (oldEntry.bs_id == entryId);
        })) {
            return entry;
        }
        return null;

    }

    const getUnit = useCallback((id: string, useB: boolean) => {
        const entry = getDoubleEntry<IUnitEntry>(unitList, id)
        return useB ? entry?.b : entry?.a;
    }, [unitList])

    function updateDoubleEntry<entryType extends IBSEntry>(oldList: IDoubleEntry<entryType>[], newEntry: entryType, useB: boolean) {
        let exists = false;
        const newList = oldList.map((doubleEntry) => {
            if (doubleEntry.bs_id == newEntry.bs_id) {
                exists = true
                if (useB) {
                    doubleEntry.b = newEntry;
                } else {
                    doubleEntry.a = newEntry;
                }
                return doubleEntry;
            } else {
                return doubleEntry;
            }
        })
        if (exists) {return newList}
        const newDoubleEntry: IDoubleEntry<entryType> = {bs_id: newEntry.bs_id}
        if (useB) {
            newDoubleEntry.b = newEntry;
        } else {
            newDoubleEntry.a = newEntry;
        }
        return [...oldList, newDoubleEntry]
    }

    function addUnit(newEntry: IUnitEntry, useB: boolean) {
        setUnitList((oldList) => {
            return updateDoubleEntry(oldList, newEntry, useB)
        })
    }

    function addRule(rule: IRule, useB: boolean) {
        setRuleList((oldList) => {
            return updateDoubleEntry(oldList, rule, useB)
        })
    }

    function GetSelectionEntries(cat: any, useB = false) {
        if (!(cat["sharedSelectionEntries"] && cat["sharedSelectionEntries"]["selectionEntry"])) {
            return
        }
        const sharedSelectionEntries = cat ["sharedSelectionEntries"]["selectionEntry"]
        sharedSelectionEntries.map((link: any) => {
            if (link['$type'] == "unit") {
                const forceEntry: IUnitEntry = {
                    name: link["$name"],
                    bs_id: link["$id"],
                    raw_data: link,
                }
                addUnit(forceEntry, useB)
            }
        })
    }

    function GetRules(cat: any, useB = false) {
        if (!(cat["sharedRules"] && cat["sharedRules"]["rule"])) {
            return
        }
        const rules = cat["sharedRules"]["rule"]
        const xmlRuleToRule = (rule: any) => {
            const ruleEntry: IRule = {
                name: rule["$name"],
                bs_id: rule["$id"],
                description: rule["description"],
            }
            console.log(ruleEntry)
            addRule(ruleEntry, useB)
        }
        if (Array.isArray(rules)) {
            rules.map((rule: any) => {
                xmlRuleToRule(rule)
            })
        } else {
            xmlRuleToRule(rules) // Rules is just a singular rule
        }
    }

    function GetForceSlots(cat: any, useB: boolean) {
        if (!(cat["entryLinks"] && cat["entryLinks"]["entryLink"])) {
            return
        }
        const links = cat["entryLinks"]["entryLink"]

        links.map((link: any) => {
            function GetFOSlot(categoryLink: any) {
                const cat_id = categoryLink.$targetId
                switch (cat_id) {
                    case "4f85-eb33-30c9-8f51":
                        return fos.hq
                    case "36c3-e85e-97cc-c503":
                        //This thing is a unit
                        break;
                }
                return undefined;
            }

            let slot = null;
            if (Array.isArray(link["categoryLinks"]["categoryLink"])) {
                link["categoryLinks"]["categoryLink"].map((categoryLink: any) => {
                    slot = GetFOSlot(categoryLink)
                })
            } else {
                slot = GetFOSlot(link["categoryLinks"]["categoryLink"])
            }
            if (slot) {
                const unitEntry = getUnit(link.$targetId, useB)
                if (unitEntry && unitEntry.unit) {
                    unitEntry.unit.fos = slot
                    addUnit(unitEntry, useB)
                }

            }
        })
    }

    return <div>
        <div className="row">
            <div className="column">
                Source A: <input type={"text"} value={sourceA}
                                 onChange={(event) => setSourceA(event.target.value)}></input>
                <Checkbox label={"Show A:"} checked={showA} onChange={(event, checked) => setShowA(checked ?? false)}/>

            </div>
            <div className="column">
                Source B: <input type={"text"} value={sourceB}
                                 onChange={(event) => setSourceB(event.target.value)}></input>
                <Checkbox label={"Show B:"} checked={showB} onChange={(event, checked) => setShowB(checked ?? false)}/>
            </div>
        </div>
        <div className="row">
            {!dataLoading && <ActionButton onClick={loadData}>Load Data</ActionButton>}
            <Checkbox label={"Highlight Changes:"} checked={highlightDiffs}
                      onChange={(event, checked) => setHighlightDiffs(checked ?? false)}/>

        </div>
        <div className="row">
            <h2>Units</h2>
        </div>
        {unitList.length ? unitList.map((entry) => {
            return <div className="row">
                <div className="column" hidden={!showA}>

                    {entry.a && <Datasheet forceEntry={entry.a}/>}
                </div>
                <div className="column" hidden={!showB}>

                    {entry.b && <Datasheet forceEntry={entry.b}/>}
                </div>
            </div>
        }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
        <div className="row">
            <h2>Rules</h2>
        </div>
        {ruleList.length ? ruleList.map((entry) => {
            return <div className="row">
                <div className="column" hidden={!showA}>

                    {entry.a && <div><strong>{entry.a.name}</strong>: {entry.a.description} </div>}
                </div>
                <div className="column" hidden={!showB}>

                    {entry.b && <div><strong>{entry.b.name}</strong>: {entry.b.description} </div>}
                </div>
            </div>
        }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
    </div>
}


export default App;