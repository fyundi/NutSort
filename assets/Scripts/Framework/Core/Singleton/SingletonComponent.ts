import { Component, Node, director, game, _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * 组件单例基类
 */
@ccclass('SingletonComponent')
export class SingletonComponent extends Component {
    private static _instance: any = null;
    private static _root: Node | null = null;

    private static get root(): Node {
        if (!this._root) {
            // 创建根节点
            this._root = new Node('Singleton');
            // 添加到场景
            const scene = director.getScene();
            if (scene) {
                scene.addChild(this._root);
                // 设置为持久节点
                director.addPersistRootNode(this._root);
            }
        }
        return this._root;
    }

    protected onLoad(): void {
        const constructor = this.constructor as typeof SingletonComponent;
        if (constructor._instance) {
            this.node.destroy();
            return;
        }
        constructor._instance = this;
        
        // 确保节点在Singleton根节点下
        const root = SingletonComponent.root;
        if (this.node.parent !== root) {
            root.addChild(this.node);
        }
    }

    protected onDestroy(): void {
        const constructor = this.constructor as typeof SingletonComponent;
        if (constructor._instance === this) {
            constructor._instance = null;
        }
    }

    protected static createInstance<T extends SingletonComponent>(this: new () => T): T {
        const node = new Node(this.name);
        const instance = node.addComponent(this);
        SingletonComponent.root.addChild(node);
        return instance;
    }

    public static get Instance(): any {
        if (!this._instance) {
            this._instance = this.createInstance();
        }
        return this._instance;
    }
} 