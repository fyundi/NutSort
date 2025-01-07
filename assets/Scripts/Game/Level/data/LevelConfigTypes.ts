// 关卡地图配置
export interface MapConfig {
    update_at: number;
    stages: StageConfig[];
}

// 关卡组配置
export interface StageConfig {
    stage_id: string;     // 关卡组ID
    level_count: number;  // 关卡数量
    url: string;         // 关卡数据路径
}

// 关卡数据
export interface LevelConfig {
    stage_id: string;
    levels: LevelData[];
}

// 单个关卡数据
export interface LevelData {
    level_type: number;
    puzzle_id: string;
    tubes: number[][];
    steps: number[][];
}