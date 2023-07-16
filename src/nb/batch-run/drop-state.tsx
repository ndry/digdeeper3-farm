import { parseFullTransitionLookupTable } from "../../ca";
import { fillSpace } from "../../ca/fill-space";
import { createMulberry32 } from "../../utils/mulberry32";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import { Dropzone, directionVec } from "../nb-2023-07-06/run";
import { getNeuralWalkerSight, neighborhoodRadius } from "./neural-walker";


class _DropState {
    _spacetime: Uint8Array[];
    _table: number[];
    _spacetimeRandom32: () => number;
    _iStateMap: number[];
    _playerPositionX: number;
    _playerPositionT: number;
    _maxDepth: number;
    _stepCount: number;
    _depth: number;
    _speed: number;

    constructor(
        readonly dropzone: ReadonlyDeep<Dropzone>,
    ) {
        this._table = parseFullTransitionLookupTable(dropzone.code);
        this._spacetimeRandom32 = createMulberry32(dropzone.seed);
        this._iStateMap = [
            dropzone.stateMap.indexOf(0),
            dropzone.stateMap.indexOf(1),
            dropzone.stateMap.indexOf(2),
        ];

        /**
         * Spacetime is evolved per request
         * and cells are mutable (energy or walls would become empty)
         */
        const spaceSize = dropzone.spaceSize;
        const startFillState = dropzone.stateMap.indexOf(0);
        const stateCount = dropzone.stateMap.length;
        this._spacetime = [
            new Uint8Array(spaceSize)
                .fill(startFillState),
            new Uint8Array(spaceSize)
                .map(() => this._spacetimeRandom32() % stateCount),
            new Uint8Array(spaceSize)
                .map(() => this._spacetimeRandom32() % stateCount),
        ];



        this._playerPositionX = Math.floor(spaceSize / 2);
        this._playerPositionT = 0;
        // this._playerEnergy = 3;
        this._maxDepth = 0;
        this._stepCount = 0;
        this._depth = 0;
        this._speed = 0;
    }


    evaluateSpacetime(t: number) {
        while (t >= this._spacetime.length) {
            const stateCount = this.dropzone.code.stateCount;
            const spacetime = this._spacetime;

            const space = new Uint8Array(this.dropzone.spaceSize);
            space[0] = this._spacetimeRandom32() % stateCount;
            space[space.length - 1] =
                this._spacetimeRandom32() % stateCount;
            spacetime.push(space);
            fillSpace(
                stateCount,
                spacetime[spacetime.length - 3],
                spacetime[spacetime.length - 2],
                spacetime[spacetime.length - 1],
                this._table);
        }
    }

    at(t: number, x: number) {
        this.evaluateSpacetime(t);

        const s = this._spacetime[t][x];
        if (s === this.dropzone.code.stateCount) { return s; } // visited
        return this.dropzone.stateMap[s];
    }

    atWithBounds(t: number, x: number) {
        const stateCount = this.dropzone.code.stateCount;
        const spaceSize = this.dropzone.spaceSize;

        if (t < this._depth) { return stateCount + 1; }
        if (x < 0 || x >= spaceSize) { return stateCount + 1; }
        return this.at(t, x);
    }

    relativeAtWithBounds(dt: number, dx: number) {
        return this.atWithBounds(
            this._playerPositionT + dt,
            this._playerPositionX + dx);
    }

    step(direction: 0 | 1 | 2 | 3) {
        this._playerPositionX += directionVec[direction][0];
        this._playerPositionT += directionVec[direction][1];
        // const s = at(playerPositionT, playerPositionX);
        // if (s === 2) { playerEnergy++; }
        // if (s === 1) { playerEnergy -= 9; }
        // ensure next slice before altering current
        this.evaluateSpacetime(this._playerPositionT + 3);


        const stateCount = this.dropzone.code.stateCount;

        this._spacetime[this._playerPositionT][this._playerPositionX] =
            stateCount;

        if (this._playerPositionT > this._maxDepth) {
            this._maxDepth = this._playerPositionT;
            this._depth = Math.max(
                0,
                this._maxDepth - this.dropzone.depthLeftBehind);
            this._speed = this._maxDepth / this._stepCount;
        }

        this._stepCount++;
    }

    getSight() { return getNeuralWalkerSight(this); }

    /** Performance critical, optimized for speed */
    getNeuralWalkerSightInto<T extends Record<number, number>>(
        output: T, offset: number,
    ) {
        const r = neighborhoodRadius;
        const {
            _playerPositionX: px,
            _playerPositionT: pt,
            _depth: depth,
            dropzone: {
                stateMap,
                code: {
                    stateCount,
                },
            },
            _spacetime: spacetime,
        } = this;

        this.evaluateSpacetime(pt + r);

        let i = offset;
        let dt = -r;

        // fill for the bounds on t < depth
        for (; dt < depth - pt; dt++) {
            const xr = r - Math.abs(dt);
            for (let dx = -xr; dx <= xr; dx++) { output[i++] = 1; }
        }

        // fill for the rest of t
        for (; dt <= r; dt++) {
            const xr = r - Math.abs(dt);
            const space = spacetime[pt + dt];

            let x = px - xr;

            // fill for the bounds on x < 0
            for (; x < 0; x++) { output[i++] = 1; }
            // fill for x in bounds
            const x1 = Math.min(space.length - 1, px + xr);
            for (; x <= x1; x++) {
                const s = space[x];
                if (s === stateCount) { // visited
                    output[i++] = 0;
                    continue;
                }

                const st = stateMap[s];
                output[i++] = ((st === 0) || (st === 2)) ? 0 : 1;
            }
            // fill for the bounds on x > space.length - 1
            for (; x <= px + xr; x++) { output[i++] = 1; }
        }

        // output[offset + i++] = playerEnergy;
        return output;
    }

    get depth() { return this._depth; }
    get maxDepth() { return this._maxDepth; }
    get playerPositionX() { return this._playerPositionX; }
    get playerPositionT() { return this._playerPositionT; }
    get speed() { return this._speed; }
    get stepCount() { return this._stepCount; }
}

/**
 * A mutable state of a single agent in a single zone
 */
export function createDropState(dropzone: ReadonlyDeep<Dropzone>) {
    return new _DropState(dropzone);
}
