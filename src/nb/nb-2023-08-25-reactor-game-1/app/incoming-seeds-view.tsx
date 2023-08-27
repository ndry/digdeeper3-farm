import { jsx } from "@emotion/react";
import { useSetRecoilState } from "recoil";
import { reactorRecoil } from "../reactor-recoil";
import update from "immutability-helper";
import { ca237v1FromSeed } from "../../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { SHA256 } from "crypto-js";
import { reactionsRecoil } from "../reactions-recoil";


export function IncomingSeedsView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const setReactor = useSetRecoilState(reactorRecoil);
    const setReactions = useSetRecoilState(reactionsRecoil);
    return <div {...props}>
        Incoming Seeds View<br />
        <br />
        A list of seeds (e.g. 100).<br />
        A player can set priority of any seed or trash it.<br />
        <br />
        The priority moves the seed to the reactor dispatch.<br />
        The trash moves the seed to the trash.<br />
        A new seed is generated to replace the moved seed.<br />

        <button onClick={() => {
            setReactor(reactor => update(reactor, {
                reactionPool: {
                    $push: [{
                        reactionSeed: {
                            rule: ca237v1FromSeed(
                                SHA256("seed." + Math.random())),
                            reagent0: ca237v1FromSeed(
                                SHA256("seed." + Math.random())),
                            reagent1: ca237v1FromSeed(
                                SHA256("seed." + Math.random())),
                        },
                        priority: 1,
                        t: 2,
                    }],
                },
            }));
        }}>Add random seed</button>
        <button onClick={() => {
            setReactions(reactions => update(reactions, {
                $push: [{
                    reactionSeed: {
                        rule: ca237v1FromSeed(
                            SHA256("seed." + Math.random())),
                        reagent0: ca237v1FromSeed(
                            SHA256("seed." + Math.random())),
                        reagent1: ca237v1FromSeed(
                            SHA256("seed." + Math.random())),
                    },
                    priority: 1,
                    t: 2,
                    isPaused: false,
                    isTrashed: false,
                    repeatAt: undefined,
                }],
            }));
        }}>Add random seed 1</button>
    </div >;
}
