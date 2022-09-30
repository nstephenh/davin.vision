import React, {useEffect, useState, useCallback} from 'react';
import './App.css';
import Datasheet, {fos, iUnit} from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';
import {parse} from 'arraybuffer-xml-parser';
import {Spinner, SpinnerSize} from "@fluentui/react";

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


    const diffRepos = useCallback(() => {
        setDataLoading(true)
        //Will be called twice in dev. Annoying strict mode thing.
        // @ts-ignore
        git.clone({
            fs,
            http,
            dir: '/srcA',
            corsProxy: 'https://cors.isomorphic-git.org',
            url: sourceA,
            singleBranch: true,
            depth: 1
        }).then(() => {
            console.log("Checked out data from ", sourceA)
            fs.promises.readdir("/srcA").then((filenames: string[]) => {
                filenames.map((filename: string) => {
                    runOnFile(filename, false, GetSelectionEntries)
                    runOnFile(filename, false, GetForceSlots)
                })
            })
        });
        git.clone({
            fs,
            http,
            dir: '/srcB',
            corsProxy: 'https://cors.isomorphic-git.org',
            url: sourceB,
            singleBranch: true,
            depth: 1
        }).then(() => {
            console.log("Checked out data from ", sourceB)
            fs.promises.readdir("/srcB").then((filenames: string[]) => {
                filenames.map((filename: string) => {
                    runOnFile(filename, true, GetSelectionEntries)
                    runOnFile(filename, true, GetForceSlots)
                })
            })
        });
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

    function GetForces(cat: any, useB = false) {
        const sses = cat ["sharedRules"]["rules"]
        sses.map((rule: any) => {
            const forceEntry: IUnitEntry = {
                name: rule["$name"],
                bs_id: rule["$id"],
                raw_data: rule,
            }
            console.log(forceEntry)
        })
    }

    function GetForceSlots(cat: any, useB: boolean) {
        const links = cat["entryLinks"]["entryLink"]
        links.map((link: any) => {
            console.log(link);
            let isUnit = false

            function GetFOSlot(categoryLink: any) {
                const cat_id = categoryLink.$targetId
                switch (cat_id) {
                    case "36c3-e85e-97cc-c503":
                        break;  //This thing is a unit
                    case "4f85-eb33-30c9-8f51":
                        return fos.hq
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
            if (isUnit) {
                console.log("Is a unit!")

            }
        })
    }

    return <div>
        <div className="row">
            <div className="column">
                Source A: <input type={"text"} value={sourceA}
                                 onChange={(event) => setSourceA(event.target.value)}></input>

            </div>
            <div className="column">
                Source B: <input type={"text"} value={sourceB}
                                 onChange={(event) => setSourceB(event.target.value)}></input>

            </div>
        </div>
        <div className="row">
            {!dataLoading && <button onClick={diffRepos}>Load Data</button>}
        </div>
        <div className="row">
            <div className="column">
                {unitListA.length ? unitListA.map((fe) => {
                    return <Datasheet forceEntry={fe}/>
                }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
            </div>
            <div className="column">
                {unitListB.length ? unitListB.map((fe) => {
                    return <Datasheet forceEntry={fe}/>
                }) : dataLoading && <Spinner size={SpinnerSize.large}/>}
            </div>
        </div>
    </div>
}


export default App;