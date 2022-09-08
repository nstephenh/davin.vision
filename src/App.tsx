import React, {useEffect} from 'react';
import './App.css';
import Datasheet from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';
import { parse } from 'arraybuffer-xml-parser';

const fs = new FS('fs')


function App() {
    useEffect(() => {
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
                fs.promises.readdir("/heresy").then((filenames)=>{
                    filenames.map((filename)=>{
                        console.log(filename)
                        const extension = filename.split(".").pop()
                        if(extension && ['cat', 'gst'].indexOf(extension) == 0){
                            console.log("Is battlescribe file: ", filename);
                            fs.promises.readFile('/heresy/'+ filename).then((content)=>{
                                let jObj = parse(content.buffer as Buffer);
                                console.log(jObj)

                            })
                        }
                    })
                })
            });
        }
    )


    return (<Datasheet/>);
}

export default App;

//fs, dir: "/heresy/",
//                 http,
//                 corsProxy: 'https://cors.isomorphic-git.org',
//                 url: 'https://github.com/BSData/horus-heresy',
//                 ref: 'main',
//                 singleBranch: true,
//                 depth: 10