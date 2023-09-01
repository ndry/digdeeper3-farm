import { atom } from "recoil";
import update, { Spec } from "immutability-helper";
import * as u from "../../utils/u";
import { SHA256 } from "crypto-js";

export type ExpeditionState = {
    probability: number;
    progress: number;
    investments: { player: string; tokens: number; }[];
    finished?: {
        payments: { player: string; tokens: number; }[];
        repayments?: { player: string; tokens: number; }[];
    }
}

export type WorldState = {
    seed: string;
    players: Record<string, { name: string; freeTokens: number; }>;
    expeditions: ExpeditionState[];
};

export const worldRecoil = atom<WorldState>({
    key: "world",
    default: {
        seed: "47bb-87af",
        players: {
            "whatabout": {
                name: "whatabout",
                freeTokens: 100,
            },
            "caramatan": {
                name: "caramatan",
                freeTokens: 100,
            },
            "Wingardium L": {
                name: "Wingardium L",
                freeTokens: 90,
            },
        },
        expeditions: [{
            probability: 0.05,
            progress: 0,
            investments: [{
                player: "Wingardium L",
                tokens: 10,
            }],
        }, {
            probability: 0.1,
            progress: 0,
            investments: [],
        }],
    },
});

export const tickExpediton = ({
    world, expeditionIndex,
}: {
    world: WorldState,
    expeditionIndex: number,
}) => {
    const getExpedition = () => world.expeditions[expeditionIndex];
    if (getExpedition().finished) { return world; }

    const unspentTokens = getExpedition().investments.reduce((acc, investment) => (
        acc + investment.tokens
    ), -getExpedition().progress);
    if (unspentTokens <= 0) { return world; }

    const probability = getExpedition().probability;
    const seed1 = SHA256(world.seed);
    world = update(world, {
        seed: { $set: seed1.toString() },
        expeditions: {
            [expeditionIndex]: {
                progress: { $apply: u.inc() },
            },
        },
    });
    const proc = ((seed1.words[0] >>> 0) / 2 ** 32) < probability;
    if (!proc) { return world; }

    const payments = getExpedition().investments.map(investment => ({
        player: investment.player,
        tokens: investment.tokens * 2,
    }));

    for (let i = 0; i < payments.length; i++) {
        world = update(world, {
            players: {
                [payments[i].player]: {
                    freeTokens: { $apply: u.inc(payments[i].tokens) },
                },
            },
        });
    }

    const repayments = structuredClone(getExpedition().investments);
    let progress = getExpedition().progress;
    for (const repayment of repayments) {
        const spent = Math.min(repayment.tokens, progress);
        repayment.tokens -= spent;
        progress -= spent;
    }
    for (let i = 0; i < repayments.length; i++) {
        world = update(world, {
            players: {
                [repayments[i].player]: {
                    freeTokens: { $apply: u.inc(repayments[i].tokens) },
                },
            },
        });
    }

    // todo: give back unspent tokens

    world = update(world, {
        expeditions: {
            [expeditionIndex]: {
                finished: {
                    $set: {
                        payments,
                        repayments,
                    },
                },
            },
        },
    });

    return world;
};

export const tickWorld = (world: WorldState) => {
    for (let i = 0; i < world.expeditions.length; i++) {
        world = tickExpediton({ world, expeditionIndex: i });
    }
    {
        const seed1 = SHA256(world.seed);
        world = update(world, {
            seed: { $set: seed1.toString() },
        });
        const proc = ((seed1.words[0] >>> 0) / 2 ** 32) < 0.01;
        if (proc) {

            world = update(world, {
                expeditions: {
                    $push: [{
                        probability:
                            ((seed1.words[1] >>> 0) / 2 ** 32)
                            * ((seed1.words[2] >>> 0) / 2 ** 32),
                        progress: 0,
                        investments: [],
                    }],
                },
            });
        }
    }

    return world;
};

export const tickWorldN = (world: WorldState, n = 1) => {
    for (let i = 0; i < n; i++) { world = tickWorld(world); }
    return world;
};

export const invest = ({
    world,
    expeditionIndex,
    playerName,
    tokens,
}: {
    world: WorldState,
    expeditionIndex: number,
    playerName: string,
    tokens: number,
}) => {
    const expedition = world.expeditions[expeditionIndex];
    const lastInvestment = expedition.investments.at(-1);
    if (lastInvestment?.player === playerName) {
        return update(world, {
            expeditions: {
                [expeditionIndex]: {
                    investments: {
                        [expedition.investments.length - 1]: {
                            tokens: { $apply: u.inc(tokens) },
                        },
                    },
                },
            },
            players: {
                [playerName]: {
                    freeTokens: { $apply: u.dec(tokens) },
                },
            },
        });
    } else {
        return update(world, {
            expeditions: {
                [expeditionIndex]: {
                    investments: {
                        $push: [{
                            player: playerName,
                            tokens,
                        }],
                    },
                },
            },
            players: {
                [playerName]: {
                    freeTokens: { $apply: u.dec(tokens) },
                },
            },
        });
    }
};
