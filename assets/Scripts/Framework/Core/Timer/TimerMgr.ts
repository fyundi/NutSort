import { director, game } from 'cc';
import { LogMgr } from '../Log/LogMgr';

/**
 * 定时器类型
 */
export enum TimerType {
    TIME,  // 基于时间的定时器
    FRAME  // 基于帧的定时器
}

/**
 * 定时器状态
 */
enum TimerState {
    IDLE,     // 空闲
    RUNNING,  // 运行中
    PAUSED    // 暂停
}

/**
 * 定时器项
 */
interface TimerItem {
    id: number;                    // 定时器ID
    type: TimerType;              // 定时器类型
    interval: number;             // 间隔（时间或帧数）
    times: number;                // 重复次数 (-1为无限循环)
    elapsed: number;              // 已经过时间或帧数
    executed: number;             // 已执行次数
    callback: Function;           // 回调函数
    thisArg: any;                // 回调函数的this指向
    state: TimerState;           // 定时器状态
    delay: number;               // 首次执行延迟
    scale: number;               // 时间缩放
    tag?: string;                // 定时器标签，用于分组管理
}

export class TimerMgr {
    private _timers: Map<number, TimerItem>;
    private _nextId: number;
    private _timeScale: number;
    private _isPaused: boolean;
    private _tagMap: Map<string, Set<number>>; // 标签到定时器ID的映射

    constructor() {
        this._timers = new Map();
        this._tagMap = new Map();
        this._nextId = 1;
        this._timeScale = 1;
        this._isPaused = false;
        this._init();
    }

    private _init(): void {
        director.on(director.EVENT_AFTER_UPDATE, this._update, this);
        LogMgr.debug('[TimerMgr] 定时器系统初始化完成');
    }

    /**
     * 更新定时器
     */
    private _update(dt: number): void {
        if (this._isPaused || dt <= 0) return;

        this._timers.forEach((timer, id) => {
            if (timer.state !== TimerState.RUNNING) return;

            const scaledDt = dt * timer.scale * this._timeScale;
            if (scaledDt <= 0) return;

            if (timer.delay > 0) {
                timer.delay -= timer.type === TimerType.TIME ? scaledDt : 1;
                return;
            }

            if (timer.type === TimerType.TIME) {
                timer.elapsed += scaledDt;
            } else {
                timer.elapsed += 1;
            }

            while (timer.elapsed >= timer.interval) {
                try {
                    timer.callback.call(timer.thisArg);
                } catch (err) {
                    LogMgr.error('[TimerMgr] 定时器回调执行错误:', err, '\n定时器信息:', timer);
                }

                timer.executed++;
                timer.elapsed -= timer.interval;

                // 检查是否完成所有次数
                if (timer.times > 0 && timer.executed >= timer.times) {
                    this.remove(id);
                    break;
                }

                // 如果是单次执行的定时器，直接跳出
                if (timer.times === 1) break;
            }
        });
    }

    private _addToTagMap(id: number, tag: string): void {
        if (!tag) return;
        
        let timerSet = this._tagMap.get(tag);
        if (!timerSet) {
            timerSet = new Set();
            this._tagMap.set(tag, timerSet);
        }
        timerSet.add(id);
    }

    private _removeFromTagMap(id: number, tag: string): void {
        if (!tag) return;
        
        const timerSet = this._tagMap.get(tag);
        if (timerSet) {
            timerSet.delete(id);
            if (timerSet.size === 0) {
                this._tagMap.delete(tag);
            }
        }
    }

    /**
     * 创建定时器
     */
    public schedule(
        interval: number,
        callback: Function,
        thisArg?: any,
        times: number = 1,
        delay: number = 0,
        scale: number = 1,
        tag?: string
    ): number {
        if (interval < 0 || !callback) {
            LogMgr.warn('[TimerMgr] 无效的定时器参数');
            return 0;
        }

        const id = this._nextId++;
        const timer: TimerItem = {
            id,
            type: TimerType.TIME,
            interval: Math.max(0.0001, interval),
            times,
            elapsed: 0,
            executed: 0,
            callback,
            thisArg,
            state: TimerState.RUNNING,
            delay,
            scale,
            tag
        };

        this._timers.set(id, timer);
        this._addToTagMap(id, tag);
        return id;
    }

    /**
     * 创建帧定时器
     * @param interval 间隔帧数
     * @param callback 回调函数
     * @param thisArg this指向
     * @param times 重复次数(-1为无限循环)
     * @param delay 首次执行延迟(帧数)
     */
    public scheduleByFrame(
        interval: number,
        callback: Function,
        thisArg?: any,
        times: number = 1,
        delay: number = 0,
        tag?: string
    ): number {
        if (interval < 1 || !callback) {
            LogMgr.warn('[TimerMgr] 无效的帧定时器参数');
            return 0;
        }

        const id = this._nextId++;
        const timer: TimerItem = {
            id,
            type: TimerType.FRAME,
            interval: Math.floor(interval),
            times,
            elapsed: 0,
            executed: 0,
            callback,
            thisArg,
            state: TimerState.RUNNING,
            delay,
            scale: 1,
            tag
        };

        this._timers.set(id, timer);
        this._addToTagMap(id, tag);
        return id;
    }

    /**
     * 延迟执行
     * @param delay 延迟时间(秒)
     * @param callback 回调函数
     * @param thisArg this指向
     */
    public scheduleOnce(delay: number, callback: Function, thisArg?: any): number {
        return this.schedule(0.0001, callback, thisArg, 1, delay);
    }

    /**
     * 移除定时器
     */
    public remove(id: number): void {
        const timer = this._timers.get(id);
        if (timer) {
            this._removeFromTagMap(id, timer.tag);
            this._timers.delete(id);
        }
    }

    /**
     * 移除定时器
     */
    public removeByTag(tag: string): void {
        const timerSet = this._tagMap.get(tag);
        if (timerSet) {
            timerSet.forEach(id => this.remove(id));
            this._tagMap.delete(tag);
        }
    }

    /**
     * 暂停定时器
     */
    public pause(id: number): void {
        const timer = this._timers.get(id);
        if (timer) {
            timer.state = TimerState.PAUSED;
        }
    }

    /**
     * 恢复定时器
     */
    public resume(id: number): void {
        const timer = this._timers.get(id);
        if (timer) {
            timer.state = TimerState.RUNNING;
        }
    }

    /**
     * 暂停所有定时器
     */
    public pauseAll(): void {
        this._isPaused = true;
    }

    /**
     * 恢复所有定时器
     */
    public resumeAll(): void {
        this._isPaused = false;
    }

    /**
     * 设置全局时间缩放
     */
    public setTimeScale(scale: number): void {
        this._timeScale = Math.max(0, scale);
    }

    /**
     * 获取全局时间缩放
     */
    public getTimeScale(): number {
        return this._timeScale;
    }

    /**
     * 清理所有定时器
     */
    public clear(): void {
        this._timers.clear();
    }

    /**
     * 销毁定时器系统
     */
    public destroy(): void {
        this.clear();
        director.off(director.EVENT_AFTER_UPDATE, this._update, this);
        LogMgr.debug('[TimerMgr] 定时器系统已销毁');
    }

    /**
     * 获取定时器信息
     */
    public getTimerInfo(id: number): Readonly<TimerItem> | null {
        return this._timers.get(id) || null;
    }

    /**
     * 获取活动定时器数量
     */
    public getActiveTimerCount(): number {
        return this._timers.size;
    }
} 