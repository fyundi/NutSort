import { LogMgr } from "../../../Framework/Core/Log/LogMgr";
import { LevelTypeData, MapDesc } from "../Core/LevelTypes";
import { BaseLevelHandler } from "./BaseLevelHandler";

export class DailyLevelHandler extends BaseLevelHandler {
    protected readonly _tag: string = 'DailyLevelHandler';
    protected readonly _prefix: string = 'd_lv';
    protected readonly _firstLevel: number = 1;

    public computeStage(data: LevelTypeData, level: number, useDefault: boolean): void {
        const mapData = useDefault ? data.defaultMap : (data.saveMap || data.defaultMap);
        if (!mapData) {
            LogMgr.error(`[${this.tag}] No map data available`);
            return;
        }

        // 每日关卡只有一个stage
        if (mapData.stages.length > 0) {
            const stage = mapData.stages[0];
            data.stageIndex = 0;
            data.stageStartLevel = 1;
            data.stageEndLevel = stage.levels.length;
            data.currentStage = stage;
        } else {
            LogMgr.error(`[${this.tag}] No stages available`);
        }
    }

    protected async loadRemoteConfig(): Promise<MapDesc> {
        // TODO: 实现远程配置加载
        return {
            update_at: Date.now(),
            stages: [{
                stage_id: 'daily',
                level_count: 1,
                url: 'daily'
            }]
        };
    }
} 