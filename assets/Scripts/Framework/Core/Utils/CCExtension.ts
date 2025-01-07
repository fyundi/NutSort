import { Node, Vec2, Vec3, Component } from 'cc';

declare module 'cc' {
    interface Node {
        getOrAddComponent<T extends Component>(type: new () => T): T;
    }

    // Vec3扩展
    interface Vec3 {
        setValues(x?: number, y?: number, z?: number): Vec3;
        addValues(x?: number, y?: number, z?: number): Vec3;
        subValues(x?: number, y?: number, z?: number): Vec3;
        mulValues(x?: number, y?: number, z?: number): Vec3;
        divValues(x?: number, y?: number, z?: number): Vec3;
        lerp(to: Vec3, ratio: number): Vec3;
    }
}

export function initCCExtension(): void {
    // Node扩展
    Object.assign(Node.prototype, {
        getOrAddComponent<T extends Component>(type: new () => T): T {
            let comp = this.getComponent(type);
            if (!comp) {
                comp = this.addComponent(type);
            }
            return comp;
        }
    });

    // Vec3扩展
    Object.assign(Vec3.prototype, {
        setValues(x?: number, y?: number, z?: number): Vec3 {
            if (x !== undefined) this.x = x;
            if (y !== undefined) this.y = y;
            if (z !== undefined) this.z = z;
            return this;
        },

        addValues(x = 0, y = 0, z = 0): Vec3 {
            this.x += x;
            this.y += y;
            this.z += z;
            return this;
        },

        subValues(x = 0, y = 0, z = 0): Vec3 {
            this.x -= x;
            this.y -= y;
            this.z -= z;
            return this;
        },

        mulValues(x = 1, y = 1, z = 1): Vec3 {
            this.x *= x;
            this.y *= y;
            this.z *= z;
            return this;
        },

        divValues(x = 1, y = 1, z = 1): Vec3 {
            if (x !== 0) this.x /= x;
            if (y !== 0) this.y /= y;
            if (z !== 0) this.z /= z;
            return this;
        },

        lerp(to: Vec3, ratio: number): Vec3 {
            ratio = Math.max(0, Math.min(1, ratio));
            this.x += (to.x - this.x) * ratio;
            this.y += (to.y - this.y) * ratio;
            this.z += (to.z - this.z) * ratio;
            return this;
        }
    });
} 