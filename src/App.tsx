import React, {useEffect, useState} from 'react';
import './App.css';
import Datasheet, {iUnit} from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';
import {parse} from 'arraybuffer-xml-parser';
import {Spinner, SpinnerSize} from "@fluentui/react";

const fs = new FS('fs')

export interface IForceEntry {
    bs_id: string
    name: string
    raw_data: any
    unit?: iUnit;
}

function App() {
    const [unitList, setUnitList] = useState(Array<IForceEntry>())
    const [dataLoading, setDataLoading] = useState(false)


    useEffect(() => {
            setDataLoading(true)
            //Will be called twice in dev. Annoying strict mode thing.
            // @ts-ignore
            git.clone({
                fs,
                http,
                dir: '/heresy',
                corsProxy: 'https://cors.isomorphic-git.org',
                url: 'https://github.com/BSData/horus-heresy/',
                singleBranch: true,
                depth: 1
            }).then(() => {
                console.log("Checked out data from github")
                fs.promises.readdir("/heresy").then((filenames) => {
                    filenames.map((filename) => {
                        console.log(filename)
                        const extension = filename.split(".").pop()
                        if (extension && ['cat', 'gst'].indexOf(extension) == 0) {
                            console.log("Is battlescribe file: ", filename);
                            fs.promises.readFile('/heresy/' + filename).then((content) => {
                                const jObj = parse(content.buffer as Buffer);
                                const cat = (jObj as Record<string, any>)["catalogue"]
                                if (cat["$gameSystemId"] == "28d4-bd2e-4858-ece6") {
                                    console.log("Valid 2.0 cat")
                                    parseCat(cat)
                                } else {
                                    console.log("Not a 2.0 cat")
                                }

                            })
                        }
                    })
                })
            });
            setDataLoading(false)
        }, []
    )

    function parseCat(cat: any) {
        const sses = cat ["sharedSelectionEntries"]["selectionEntry"]
        sses.map((link: any) => {
            if (link['$type'] == "unit") {
                const forceEntry: IForceEntry = {
                    name: link["$name"],
                    bs_id: link["$id"],
                    raw_data: link
                }
                console.log(forceEntry)
                setUnitList((unitList) => {
                    let exists = false;
                    const newList = unitList.map((oldEntry) => {
                        if (oldEntry.bs_id == forceEntry.bs_id) {
                            exists = true
                            return forceEntry;
                        } else {
                            return oldEntry;
                        }
                    })
                    return exists ? newList : [...newList, forceEntry]
                })
            }
        })
        return
        const links = cat["entryLinks"]["entryLink"]
        links.map((link: any) => {
            console.log(link);
            let isUnit = false
            if (Array.isArray(link["categoryLinks"]["categoryLink"])) {
                link["categoryLinks"]["categoryLink"].map((category: any) => {
                    if (category.$targetId == "36c3-e85e-97cc-c503") {
                        isUnit = true
                    }
                })
            } else {
                if (link["categoryLinks"]["categoryLink"].$targetId == "36c3-e85e-97cc-c503") {
                    isUnit = true
                }
            }
            if (isUnit) {
                console.log("Is a unit!")

            }
        })
    }

    return <div>
        <table>
            <tr>
                <td>
                    Show Panoptica Changes:<input type={"checkbox"}></input>
                </td>
            </tr>
        </table>
        {dataLoading ? <Spinner size={SpinnerSize.large}/>
            :
            unitList.map((fe) => {
                return <Datasheet forceEntry={fe}/>
            })
        }
    </div>
}


export default App;