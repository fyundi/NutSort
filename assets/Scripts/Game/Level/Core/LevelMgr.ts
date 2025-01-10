import { LogMgr } from "../../../Framework/Core/Log/LogMgr";
import { App } from "../../../Framework/Core/App";
import { LevelModel } from "./LevelModel";
import { LevelType, MapData, LevelData } from "./LevelTypes";
import { BaseLevelHandler } from "../Handlers/BaseLevelHandler";
import { Singleton } from "../../../Framework/Core/Singleton/Singleton";
import { MainLevelHandler } from "../Handlers/MainLevelHandler";
import { SpecialLevelHandler } from "../Handlers/SpecialLevelHandler";
import { DailyLevelHandler } from "../Handlers/DailyLevelHandler";

export class LevelMgr extends Singleton {
    private handlers: Map<LevelType, BaseLevelHandler> = new Map();
    private model: LevelModel;

    public initialize(): void {
        this.model = App.model.get<LevelModel>('LevelModel');
        this.registerHandler(LevelType.Main, new MainLevelHandler());
        this.registerHandler(LevelType.Special, new SpecialLevelHandler());
        this.registerHandler(LevelType.Daily, new DailyLevelHandler());

        this.initHandlers();
    }

    private async initHandlers(): Promise<void> {
        for (const [type, handler] of this.handlers) {
            if (handler.isInited) continue;
            
            try {
                await handler.initialize();
                LogMgr.info(`[LevelMgr] Initialized handler for type: ${type}`);
            } catch (error) {
                LogMgr.error(`[LevelMgr] Failed to initialize handler for type: ${type}`, error);
            }
        }
    }

    private registerHandler(type: LevelType, handler: BaseLevelHandler): void {
        if (this.handlers.has(type)) {
            LogMgr.warn(`[LevelMgr] Handler already registered for type: ${type}`);
            return;
        }
        this.handlers.set(type, handler);
        this.model.initType(type);
    }

    public unregisterHandler(type: LevelType): void {
        this.handlers.delete(type);
        this.model.clearByType(type);
    }

    public getHandler(type: LevelType): BaseLevelHandler | null {
        const handler = this.handlers.get(type);
        if (!handler) {
            LogMgr.error(`[LevelMgr] No handler found for type: ${type}`);
            return null;
        }
        return handler;
    }

    public computeStage(type: LevelType, level: number, useDefault: boolean = false): void {
        const handler = this.getHandler(type);
        const data = this.model.getData(type);
        if (!handler || !data) return;

        handler.computeStage(data, level, useDefault);
    }

    public getCurrentStageId(type: LevelType): string | null {
        const handler = this.getHandler(type);
        const data = this.model.getData(type);
        if (!handler || !data) return null;

        return handler.getCurrentStageId(data);
    }

    public needUpdate(type: LevelType, remoteVersion: number): boolean {
        const handler = this.getHandler(type);
        const data = this.model.getData(type);
        if (!handler || !data) return false;

        return handler.needUpdate(data, remoteVersion);
    }

    public getLevelData(type: LevelType, level: number): LevelData | null {
        const handler = this.getHandler(type);
        const data = this.model.getData(type);
        if (!handler || !data) return null;

        return handler.getLevelData(data, level);
    }

    public setMapData(type: LevelType, isDefault: boolean, data: MapData): void {
        this.model.setMapData(type, isDefault, data);
    }

    public setCurrentLevel(type: LevelType, level: number): void {
        this.model.setCurrentLevel(type, level);
        this.computeStage(type, level);
    }

    public clear(): void {
        this.handlers.clear();
        this.model.clear();
    }
} 