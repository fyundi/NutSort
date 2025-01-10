import { LevelType, LevelTypeData, MapData, StageData } from "./LevelTypes";
import { LogMgr } from "../../../Framework/Core/Log/LogMgr";
import { IModel } from "../../../Framework/Core/Model/IModel";

export class LevelModel implements IModel {
    private levelDataMap: Map<LevelType, LevelTypeData> = new Map();

    public initType(type: LevelType): void {
        if (!this.levelDataMap.has(type)) {
            this.levelDataMap.set(type, {
                defaultMap: null,
                saveMap: null,
                currentStage: null,
                currentLevel: 1,
                stageIndex: 0,
                stageStartLevel: 1,
                stageEndLevel: 0
            });
        }
    }

    public getData(type: LevelType): LevelTypeData | null {
        const data = this.levelDataMap.get(type);
        if (!data) {
            LogMgr.error(`[LevelModel] No data found for type: ${type}`);
            return null;
        }
        return data;
    }

    public setMapData(type: LevelType, isDefault: boolean, data: MapData): void {
        const typeData = this.getData(type);
        if (!typeData) return;
        
        if (isDefault) {
            typeData.defaultMap = data;
        } else {
            typeData.saveMap = data;
        }
    }

    public setStageData(type: LevelType, data: StageData): void {
        const typeData = this.getData(type);
        if (!typeData) return;
        typeData.currentStage = data;
    }

    public setCurrentLevel(type: LevelType, level: number): void {
        const typeData = this.getData(type);
        if (!typeData) return;
        typeData.currentLevel = level;
    }

    public setStageInfo(type: LevelType, index: number, start: number, end: number): void {
        const typeData = this.getData(type);
        if (!typeData) return;
        typeData.stageIndex = index;
        typeData.stageStartLevel = start;
        typeData.stageEndLevel = end;
    }

    public clearByType(type: LevelType): void {
        this.levelDataMap.delete(type);
    }

    public clear(): void {
        this.levelDataMap.clear();
    }

    public save(): void {
    }

} 