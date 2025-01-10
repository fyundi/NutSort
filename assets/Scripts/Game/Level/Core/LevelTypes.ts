import { IModel } from "../../../Framework/Core/Model/IModel";

// 关卡类型
export enum LevelType {
    Main = 'main',
    Special = 'special',
    Daily = 'daily'
}

// 地图配置描述
export interface MapDesc {
    update_at: number;
    stages: StageDesc[];
}

// 关卡组描述
export interface StageDesc {
    stage_id: string;
    level_count: number;
    url: string;
}

// 地图数据
export interface MapData {
    update_at: number;
    stages: StageData[];
}

// 关卡组数据
export interface StageData {
    stage_id: string;
    levels: LevelData[];
}

// 关卡数据
export interface LevelData {
    level_type: number;
    puzzle_id: number;
    tubes: number;
    steps: number;
}

// 关卡类型数据
export interface LevelTypeData {
    defaultMap: MapData | null;
    saveMap: MapData | null;
    currentStage: StageData | null;
    currentLevel: number;
    stageIndex: number;
    stageStartLevel: number;
    stageEndLevel: number;
} 