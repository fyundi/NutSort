import { LogMgr } from "../../../Framework/Core/Log/LogMgr";
import { LevelTypeData, MapDesc } from "../Core/LevelTypes";
import { BaseLevelHandler } from "./BaseLevelHandler";

export class SpecialLevelHandler extends BaseLevelHandler {
    protected readonly _tag: string = 'SpecialLevelHandler';
    protected readonly _prefix: string = 's_lv';
    protected readonly _firstLevel: number = 1;

    public computeStage(data: LevelTypeData, level: number, useDefault: boolean): void {
        const mapData = useDefault ? data.defaultMap : (data.saveMap || data.defaultMap);
        if (!mapData) {
            LogMgr.error(`[${this.tag}] No map data available`);
            return;
        }

        let totalLevels = 0;
        for (let i = 0; i < mapData.stages.length; i++) {
            const stage = mapData.stages[i];
            if (level > totalLevels && level <= totalLevels + stage.levels.length) {
                data.stageIndex = i;
                data.stageStartLevel = totalLevels + 1;
                data.stageEndLevel = totalLevels + stage.levels.length;
                data.currentStage = stage;
                return;
            }
            totalLevels += stage.levels.length;
        }

        LogMgr.error(`[${this.tag}] Failed to compute stage for level: ${level}`);
    }

    protected async loadRemoteConfig(): Promise<MapDesc> {
        // TODO: 实现远程配置加载
        return {
            update_at: Date.now(),
            stages: []
        };
    }
} 