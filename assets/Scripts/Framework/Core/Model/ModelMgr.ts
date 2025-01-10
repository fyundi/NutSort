import { IModel } from "./IModel";
import { LogMgr } from "../Log/LogMgr";

export class ModelMgr {
    private _models: Map<string, IModel> = new Map();

    // 注册模型并立即初始化
    public async register<T extends IModel>(key: string, modelClass: new () => T): Promise<void> {
        if (this._models.has(key)) {
            LogMgr.warn(`Model ${key} already registered`);
            return;
        }

        const model = new modelClass();
        this._models.set(key, model);

        // 立即初始化
        if (model.init) {
            try {
                await model.init();
                LogMgr.info(`Model ${key} initialized`);
            } catch (error) {
                LogMgr.error(`Failed to initialize model ${key}:`, error);
            }
        }
    }
    
    // 获取模型
    public get<T extends IModel>(key: string): T {
        const model = this._models.get(key);
        if (!model) {
            LogMgr.warn(`Model ${key} not found`);
            return null;
        }
        return model as T;
    }
    
    // 清理所有模型
    public clear(): void {
        for (const [key, model] of this._models) {
            if (model.clear) {
                model.clear();
            }
        }
        this._models.clear();
    }
}
