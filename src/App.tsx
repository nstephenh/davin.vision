import React, {useState, useCallback} from 'react';
import './App.css';
import Datasheet, {fos, iUnit} from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';
import {parse} from 'arraybuffer-xml-parser';
import {ActionButton, Checkbox, Spinner, SpinnerSize} from "@fluentui/react";

const fs = new FS('fs')

export interface IUnitEntry {
    bs_id: string
    name: string
    raw_data: any
    unit?: iUnit;
}

export interface IRule {
    bs_id: string;
    name: string;
    description: any;
}


function App() {
    const [unitListA, setUnitListA] = useState(Array<IUnitEntry>())
    const [unitListB, setUnitListB] = useState(Array<IUnitEntry>())
    const [ruleListA, setRuleListA] = useState(Array<IRule>())
    const [ruleListB, setRuleListB] = useState(Array<IRule>())
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

    function getUnit(entryId: string, useB = false): IUnitEntry | null {
        let unit = null;
        const list = useB ? unitListB : unitListA;
        if (list.some((oldEntry) => {
            unit = oldEntry;
            return (oldEntry.bs_id == entryId);
        })) {
            return unit;
        }
        return unit;
    }

    function addUnit(unitEntry: IUnitEntry, useB: boolean) {
        const set = useB ? setUnitListB : setUnitListA;

        set((oldList) => {
            let exists = false;
            const newList = oldList.map((oldEntry) => {
                if (oldEntry.bs_id == unitEntry.bs_id) {
                    exists = true
                    return unitEntry;
                } else {
                    return oldEntry;
                }
            })
            return exists ? newList : [...oldList, unitEntry]
        })
    }

    function addRule(rule: IRule, useB: boolean) {
        const set = useB ? setRuleListB : setRuleListA;
        set((oldList) => {
            let exists = false;
            const newList = oldList.map((oldEntry) => {
                if (oldEntry.bs_id == rule.bs_id) {
                    exists = true
                    return rule;
                } else {
                    return oldEntry;
                }
            })
            return exists ? newList : [...newList, rule]
        })
    }

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

    function GetSelectionEntries(cat: any, useB = false) {
        if (!(cat["sharedSelectionEntries"] && cat["sharedSelectionEntries"]["selectionEntry"])) {
            return
        }
        const sses = cat ["sharedSelectionEntries"]["selectionEntry"]
        sses.map((link: any) => {
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
                <Checkbox label={"Show A:"} onChange={(event, checked) => setShowA(checked ?? false)}/>

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
        <div className="row">
            <div className="column" hidden={!showA}>
                {unitListA.length ? unitListA.map((fe) => {
                    return <Datasheet forceEntry={fe}/>
                }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
            </div>
            <div className="column" hidden={!showB}>
                {unitListB.length ? unitListB.map((fe) => {
                    return <Datasheet forceEntry={fe}/>
                }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
            </div>
        </div>
        <div className="row">
            <h2>Rules</h2>
        </div>
        <div className="row">
            <div className="column" hidden={!showA}>
                {ruleListA.length ? ruleListA.map((rule) => {
                    return <div><strong>{rule.name}</strong>: {rule.description} </div>
                }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
            </div>
            <div className="column" hidden={!showB}>
                {ruleListA.length ? ruleListB.map((rule) => {
                    return <div><strong>{rule.name}</strong>: {rule.description} </div>
                }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
            </div>
        </div>
    </div>
}


export default App;