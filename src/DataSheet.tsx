import React from 'react';
import './App.css';

enum fos {
    hq = "hq",
    troop = "troop",
    elite = "elite",
    fa = "fast_attack",
    hs = "heavy_support",
    low = "lord_of_war",
    primarch = 'primarch',
}


interface iRule {
    ruleId: string
    text: number
    client_binding?: boolean
}

interface iRuleInstance {
    ruleId: string
    value: number
}

interface iModel {
    name: string
    m: number
    ws: number
    bs: number
    s: number
    t: number
    w: number
    i: number
    a: number
    ld: number
    sv: number
    inv?: number
}


interface iUnit {
    name: string
    points: number
    models: iModel[]
    rules: iRule[]
    fos: fos
}

function Datasheet() {
    const unit: iUnit = {
        name: "Knight Walrus Talon",
        points: 200,
        models: [{
            m: 8, ws: 4, bs: 4, s: 7, t: 7, w: 6, i: 4, a: 3, ld: 8, sv: 3,
            name: "Knight Walrus"
        }],
        rules: [],
        fos: fos.hs
    }
    return (<>
            <table>
                <tr>
                    <td>
                        Show Panoptica Changes:<input type={"checkbox"}></input>
                    </td>
                </tr>
            </table>
            <div className={"ds-sidebar"}>
                <>Icon Here</>


            </div>
            <div className={"ds-main"}>
                <div className={'ds-name'}>
                    <span>{unit.name}</span> <span className={"ds-center-spacer"}></span>
                    <span className={"ds-name-right"}>{unit.points} Points</span>
                </div>
                <table className={"ds-table"}>
                    <tr>
                        <td className={"ds-table-name"}></td>
                        <td>M</td>
                        <td>WS</td>
                        <td>BS</td>
                        <td>S</td>
                        <td>T</td>
                        <td>W</td>
                        <td>I</td>
                        <td>A</td>
                        <td>Ld</td>
                        <td>Sv</td>
                    </tr>
                    {unit.models.map(
                        (model) => {
                            return <tr>
                                <td className={"ds-table-name"}>{model.name}</td>
                                <td>{model.m}</td>
                                <td>{model.ws}</td>
                                <td>{model.bs}</td>
                                <td>{model.s}</td>
                                <td>{model.t}</td>
                                <td>{model.w}</td>
                                <td>{model.i}</td>
                                <td>{model.a}</td>
                                <td>{model.ld}</td>
                                <td>{model.m}+</td>
                            </tr>
                        }
                    )}

                </table>
            </div>
        </>
    );
}

export default Datasheet;
