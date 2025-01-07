import { sys } from 'cc';
import { LogMgr } from '../Log/LogMgr';
import { App } from '../App';

/**
 * 震动强度枚举
 */
export enum VibrateType {
    Light = 'light',      // 轻微震动
    Medium = 'medium',    // 中等震动
    Heavy = 'heavy',      // 强烈震动
    Success = 'success',  // 成功反馈
    Warning = 'warning',  // 警告反馈
    Error = 'error'       // 错误反馈
}

/**
 * 震动时长配置(单位：毫秒)
 */
const VibrateDuration = {
    [VibrateType.Light]: 15,
    [VibrateType.Medium]: 30,
    [VibrateType.Heavy]: 40,
    [VibrateType.Success]: [50, 30],
    [VibrateType.Warning]: [40, 50, 40],
    [VibrateType.Error]: [50, 30, 50, 30]
};

export class VibrateMgr {
    private static _instance: VibrateMgr = null;
    private _enabled: boolean = true;
    private _isVibrating: boolean = false;
    private _lastVibrateTime: number = 0;
    private readonly MIN_INTERVAL: number = 50; // 最小震动间隔

    public static get instance(): VibrateMgr {
        if (!this._instance) {
            this._instance = new VibrateMgr();
        }
        return this._instance;
    }

    constructor() {
        this._enabled = App.storage.get('vibrateEnabled') !== 'false';
    }

    /**
     * 是否支持震动
     */
    public get isSupported(): boolean {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            return typeof navigator.vibrate === 'function';
        } else if (sys.platform === sys.Platform.ANDROID) {
            return typeof jsb?.vibrate === 'function';
        } else if (sys.platform === sys.Platform.IOS) {
            return typeof jsb?.vibrate === 'function';
        }
        return false;
    }

    /**
     * 是否启用震动
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    /**
     * 设置是否启用震动
     */
    public set enabled(value: boolean) {
        this._enabled = value;
        App.storage.set('vibrateEnabled', value.toString());
    }

    /**
     * 执行震动
     * @param type 震动类型
     */
    public vibrate(type: VibrateType = VibrateType.Light): void {
        if (!this._enabled || !this.isSupported) return;

        const now = Date.now();
        if (now - this._lastVibrateTime < this.MIN_INTERVAL) {
            return;
        }

        try {
            const pattern = VibrateDuration[type];
            if (Array.isArray(pattern)) {
                this._vibratePattern(pattern);
            } else {
                this._vibrateDuration(pattern);
            }
            this._lastVibrateTime = now;
            LogMgr.debug('[VibrateMgr] 执行震动:', type);
        } catch (err) {
            LogMgr.error('[VibrateMgr] 震动执行失败:', err);
        }
    }

    /**
     * 执行指定时长的震动
     */
    private _vibrateDuration(duration: number): void {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            navigator.vibrate(duration);
        } else if (sys.platform === sys.Platform.ANDROID) {
            jsb?.vibrate(duration);
        } else if (sys.platform === sys.Platform.IOS) {
            // iOS的震动强度是固定的，只能控制次数
            jsb?.vibrate(20);
        }
    }

    /**
     * 执行震动模式
     * @param pattern 震动模式数组，奇数下标表示震动时长，偶数下标表示等待时长
     */
    private _vibratePattern(pattern: number[]): void {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            navigator.vibrate(pattern);
        } else {
            // 原生平台需要手动实现震动模式
            this._executePattern(pattern);
        }
    }

    /**
     * 在原生平台执行震动模式
     */
    private async _executePattern(pattern: number[]): Promise<void> {
        if (this._isVibrating) return;

        this._isVibrating = true;
        try {
            for (let i = 0; i < pattern.length; i++) {
                if (i % 2 === 0) {
                    // 震动
                    if (sys.platform === sys.Platform.ANDROID) {
                        jsb?.vibrate(pattern[i]);
                    } else if (sys.platform === sys.Platform.IOS) {
                        jsb?.vibrate(20);
                    }
                }
                // 等待
                await new Promise(resolve => setTimeout(resolve, pattern[i]));
            }
        } finally {
            this._isVibrating = false;
        }
    }

    /**
     * 停止震动
     */
    public stop(): void {
        if (!this.isSupported) return;

        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            navigator.vibrate(0);
        }
        this._isVibrating = false;
    }
} 