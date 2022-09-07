import React, {useEffect} from 'react';
import './App.css';
import Datasheet from "./DataSheet";

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs';

const fs = new FS('fs')


function App() {
    useEffect(() => {
            git.clone({
                fs, dir: "/heresy/",
                http,
                corsProxy: 'https://cors.isomorphic-git.org',
                url: 'https://github.com/BSData/horus-heresy',
                ref: 'main',
                singleBranch: true,
                depth: 10
            }).then(() => {
                console.log("Checked out data from github")

            });
        }
    )


    return (<Datasheet/>);
}

export default App;
