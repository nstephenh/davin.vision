import React, {useEffect, useState} from 'react';
import './App.css';
import Datasheet from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';
import {parse} from 'arraybuffer-xml-parser';

const fs = new FS('fs')

interface IForceEntry {
    bs_id: string
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
        }, []
    )

    function parseCat(cat: any) {
        console.log(cat)
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


    return (<Datasheet/>);
}

export default App;