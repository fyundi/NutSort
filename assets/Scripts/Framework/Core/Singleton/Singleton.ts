/**
 * 单例基类
 */
export abstract class Singleton {
    protected constructor() {
        // 保护构造函数,防止外部直接实例化
    }

    protected static _instance: any = null;

    public static get Instance(): any {
        if (!this._instance) {
            this._instance = new (this as any)();
        }
        return this._instance;
    }

    public initialize?(): void;
} 