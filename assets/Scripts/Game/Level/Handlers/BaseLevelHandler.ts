import { LogMgr } from "../../../Framework/Core/Log/LogMgr";
import { LevelData, LevelTypeData, MapDesc } from "../Core/LevelTypes";

/**
 * 关卡处理器抽象基类
 */
export abstract class BaseLevelHandler {
    private _remoteMapConfig: MapDesc | null = null;
    private _isInited: boolean = false;

    protected abstract readonly _tag: string;
    protected abstract readonly _prefix: string;
    protected abstract readonly _firstLevel: number;

    public get remoteMapConfig(): MapDesc {
        return this._remoteMapConfig!;
    }

    public get isInited(): boolean {
        return this._isInited;
    }

    public get tag(): string {
        return this._tag;
    }

    public get prefix(): string {
        return this._prefix;
    }

    public get firstLevel(): number {
        return this._firstLevel;
    }

    public async initialize(): Promise<void> {
        try {
            this._remoteMapConfig = await this.loadRemoteConfig();
            this._isInited = true;
            LogMgr.info(`[${this.tag}] Initialized successfully`);
        } catch (error) {
            LogMgr.error(`[${this.tag}] Failed to initialize`, error);
        }
    }

    public getCurrentStageId(data: LevelTypeData): string {
        if (!data.currentStage) {
            LogMgr.error(`[${this.tag}] No current stage data`);
            return '';
        }
        return data.currentStage.stage_id;
    }

    public needUpdate(data: LevelTypeData, remoteVersion: number): boolean {
        const localVersion = data.saveMap?.update_at || 0;
        return localVersion < remoteVersion;
    }

    public getLevelData(data: LevelTypeData, level: number): LevelData | null {
        if (!data.currentStage) {
            LogMgr.error(`[${this.tag}] No current stage data`);
            return null;
        }

        const relativeLevel = level - data.stageStartLevel;
        if (relativeLevel < 0 || relativeLevel >= data.currentStage.levels.length) {
            LogMgr.error(`[${this.tag}] Level ${level} out of range for current stage`);
            return null;
        }

        return data.currentStage.levels[relativeLevel];
    }

    /**
     * 计算关卡所在组
     * @param data 关卡类型数据
     * @param level 关卡编号
     * @param useDefault 是否使用默认配置
     */
    public abstract computeStage(data: LevelTypeData, level: number, useDefault: boolean): void;

    /**
     * 加载远程配置
     */
    protected abstract loadRemoteConfig(): Promise<MapDesc>;
} 