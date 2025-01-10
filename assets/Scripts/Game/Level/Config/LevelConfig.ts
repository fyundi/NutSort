import { LevelType } from "../Core/LevelTypes";

// 配置文件前缀
export const CONFIG_PREFIX = {
    [LevelType.Main]: '',
    [LevelType.Special]: 's_'
} as const;

// 配置文件路径
export const CONFIG_PATH = {
    BASE: 'Level/',
    CACHE: 'cache'
} as const;

// 关卡事件定义
export const LevelEvents = {
    LEVEL_CHANGED: 'level_changed',
    STAGE_LOADED: 'stage_loaded',
    CONFIG_UPDATED: 'config_updated',
    LOAD_ERROR: 'load_error'
} as const; 