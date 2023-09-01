import { useRecoilState } from "recoil";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { invest, tickWorldN, worldRecoil } from "./world-recoil";
import { currentPlayerNameRecoil } from "./current-player-name-recoil";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";
import * as u from "../../utils/u";

export default function Component() {
    const [world, setWorld] = useRecoilState(worldRecoil);
    const [currentPlayerName, setCurrentPlayerName] =
        useRecoilState(currentPlayerNameRecoil);
    const currentPlayer = world.players[currentPlayerName];

    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            Current player:
            &nbsp;{currentPlayer?.name} / {currentPlayer?.freeTokens} tokens
            / change: <select
                value={currentPlayerName}
                onChange={e => { setCurrentPlayerName(e.target.value); }}
            >{Object.keys(world.players).map(playerName => (
                <option key={playerName} value={playerName}>{playerName}</option>
            ))}</select>
            <br />
            <button onClick={() => {
                setWorld(tickWorldN(world, 1));
            }}>Tick</button>
            <button onClick={() => {
                setWorld(tickWorldN(world, 10));
            }}>Tick 10</button>
            <button onClick={() => {
                setWorld(tickWorldN(world, 100));
            }}>Tick 100</button>
            {world.expeditions
                .filter(expedition => !expedition.finished)
                .map((expedition, i) => (
                    <div
                        key={i}
                        css={{
                            border: "1px solid #50ff5040",
                            padding: "1em",
                            margin: "1em",
                        }}
                    >
                        <span css={{
                            textDecoration:
                                expedition.finished ? "line-through" : "none",
                        }}>
                            Expedition {i}:
                        </span>
                        <br />
                        - probability: {expedition.probability}
                        &nbsp;/
                        progress: {expedition.progress}
                        &nbsp;/
                        unspent tokens: {expedition.investments.reduce((acc, investment) => (
                            acc + investment.tokens
                        ), -expedition.progress)}
                        <br />
                        <button
                            onClick={() => {
                                setWorld(invest({
                                    world,
                                    expeditionIndex: i,
                                    playerName: currentPlayerName,
                                    tokens: 1,
                                }));
                            }}
                            disabled={
                                !!expedition.finished
                                || currentPlayer.freeTokens < 1
                            }
                        >Invest</button>
                        <button
                            onClick={() => {
                                setWorld(invest({
                                    world,
                                    expeditionIndex: i,
                                    playerName: currentPlayerName,
                                    tokens: 10,
                                }));
                            }}
                            disabled={
                                !!expedition.finished
                                || currentPlayer.freeTokens < 10
                            }
                        >Invest 10</button>
                        <button
                            onClick={() => {
                                setWorld(invest({
                                    world,
                                    expeditionIndex: i,
                                    playerName: currentPlayerName,
                                    tokens: currentPlayer.freeTokens,
                                }));
                            }}
                            disabled={
                                !!expedition.finished
                                || currentPlayer.freeTokens <= 0
                            }
                        >Invest all {currentPlayer.freeTokens}</button>
                        <br />
                        - investments:
                        {expedition.investments.map((investment, j) => (
                            <div key={j}>
                                -- {investment.player}: {investment.tokens}
                            </div>
                        ))}
                    </div>
                ))}

            {world.expeditions
                .filter(expedition => expedition.finished)
                .map((expedition, i) => (
                    <div
                        key={i}
                        css={{
                            border: "1px solid #50ff5040",
                            padding: "1em",
                            margin: "1em",
                        }}
                    >
                        <span css={{
                            textDecoration:
                                expedition.finished ? "line-through" : "none",
                        }}>
                            Expedition {i}:
                        </span>
                        <br />
                        - probability: {expedition.probability}
                        &nbsp;/
                        progress: {expedition.progress}
                        &nbsp;/
                        unspent tokens: {expedition.investments.reduce((acc, investment) => (
                            acc + investment.tokens
                        ), -expedition.progress)}
                        <br />
                        - investments:
                        {expedition.investments.map((investment, j) => (
                            <div key={j}>
                                -- {investment.player}: {investment.tokens}
                            </div>
                        ))}
                        - payments:
                        {expedition.finished?.payments.map((payment, j) => (
                            <div key={j}>
                                -- {payment.player}: {payment.tokens}
                            </div>
                        ))}
                    </div>
                ))}
            <pre>
                {jsonBeautify(world, null as any, 2, 80)}
            </pre>
        </div >
    );
}

