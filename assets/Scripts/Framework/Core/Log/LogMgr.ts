import { DEBUG } from 'cc/env';
import { sys } from 'cc';

/**
 * 日志级别
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * 日志管理器
 */
export class LogMgr {
    private static _level: LogLevel = DEBUG ? LogLevel.DEBUG : LogLevel.INFO;
    private static _logs: string[] = [];
    private static readonly MAX_LOGS = 1000;

    /**
     * 设置日志级别
     */
    public static setLevel(level: LogLevel): void {
        this._level = level;
    }

    /**
     * 调试日志
     */
    public static debug(...args: any[]): void {
        if (this._level <= LogLevel.DEBUG) {
            console.log(`[DEBUG] ${this._getTime()}`, ...args);
            this._saveLogs('DEBUG', ...args);
        }
    }

    /**
     * 信息日志
     */
    public static info(...args: any[]): void {
        if (this._level <= LogLevel.INFO) {
            console.info(`[INFO] ${this._getTime()}`, ...args);
            this._saveLogs('INFO', ...args);
        }
    }

    /**
     * 警告日志
     */
    public static warn(...args: any[]): void {
        if (this._level <= LogLevel.WARN) {
            console.warn(`[WARN] ${this._getTime()}`, ...args);
            this._saveLogs('WARN', ...args);
        }
    }

    /**
     * 错误日志
     */
    public static error(...args: any[]): void {
        if (this._level <= LogLevel.ERROR) {
            console.error(`[ERROR] ${this._getTime()}`, ...args);
            this._saveLogs('ERROR', ...args);
        }
    }

    /**
     * 获取当前时间字符串
     */
    private static _getTime(): string {
        const date = new Date();
        return `${this._formatNumber(date.getHours())}:${
            this._formatNumber(date.getMinutes())}:${
            this._formatNumber(date.getSeconds())}.${
            this._formatNumber(date.getMilliseconds(), 3)}`;
    }

    /**
     * 格式化数字为指定长度的字符串
     */
    private static _formatNumber(num: number, width: number = 2): string {
        let result = num.toString();
        while (result.length < width) {
            result = '0' + result;
        }
        return result;
    }

    /**
     * 保存日志
     */
    private static _saveLogs(level: string, ...args: any[]): void {
        const log = `[${level}] ${this._getTime()} ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`;
            
        this._logs.push(log);
        if (this._logs.length > this.MAX_LOGS) {
            this._logs.shift();
        }
    }

    /**
     * 获取所有日志
     */
    public static getLogs(): string[] {
        return [...this._logs];
    }

    /**
     * 清除日志
     */
    public static clear(): void {
        this._logs = [];
    }

    /**
     * 导出日志到文件（仅原生平台支持）
     */
    public static async exportLogs(): Promise<void> {
        if (!sys.isNative) {
            this.warn('导出日志功能仅在原生平台支持');
            return;
        }

        try {
            const content = this._logs.join('\n');
            const path = `${sys.localStorage.getWritablePath()}game_logs_${Date.now()}.txt`;
            await sys.localStorage.writeFile(content, path);
            this.info('日志导出成功:', path);
        } catch (err) {
            this.error('日志导出失败:', err);
        }
    }
} 