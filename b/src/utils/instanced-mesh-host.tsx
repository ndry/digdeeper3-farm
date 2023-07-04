import { Color, InstancedMesh, Matrix4 } from "three";
import { _throw } from "./_throw";

export const zeroScaleMatrix = new Matrix4().set(
    0, 0, 0, 0, /**/ 0, 0, 0, 0, /**/ 0, 0, 0, 0, /**/ 0, 0, 0, 1);

export class InstancedMeshClient {

    isInUse = false;

    constructor(
        public host: InstancedMeshHost,
        public index: number,
    ) {
        this.host = host;
        this.index = index;
        this.deuse();
    }

    setMatrix(m: Matrix4) {
        this.host.setMatrixAt(this.index, m);
        this.host.instanceMatrix.needsUpdate = true;
    }

    setColor(c: Color) {
        this.host.setColorAt(this.index, c);
        // the above setColorAt initializes instanceColor
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.host.instanceColor!.needsUpdate = true;
    }

    use() { this.isInUse = true; }

    deuse() {
        this.isInUse = false;
        this.setMatrix(zeroScaleMatrix);
    }
}


export class InstancedMeshHost extends InstancedMesh {
    clients: InstancedMeshClient[];

    constructor(
        ...args: ConstructorParameters<typeof InstancedMesh>
    ) {
        super(...args);

        this.clients = Array.from(
            { length: this.count },
            (_, i) => new InstancedMeshClient(this, i));
    }

    lastServedIndex = 0;
    getFreeClient() {
        // try to find a free client starting from the last served one
        // due to belief they have similar use duration
        for (let _i = 0; _i < this.clients.length; _i++) {
            const i = (this.lastServedIndex + _i) % this.clients.length;
            const client = this.clients[i];
            if (!client.isInUse) {
                client.use();
                this.lastServedIndex = i;
                return client;
            }
        }
    }
    getFreeClientOrThrow() {
        return this.getFreeClient() ?? _throw("no free client");
    }
}
