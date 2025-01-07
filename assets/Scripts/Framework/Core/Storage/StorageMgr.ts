import { sys, native } from 'cc';
import { LogMgr } from '../Log/LogMgr';

/**
 * 存储数据类型
 */
type StorageValue = string | number | boolean | object | Array<any>;

/**
 * 存储管理器
 */
export class StorageMgr {
    private readonly KEY_PREFIX = 'game_';
    private _platform: string;
    private _cache: Map<string, StorageValue>;

    constructor() {
        this._cache = new Map<string, StorageValue>();
        this._platform = this._getPlatform();
        this._init();
    }

    /**
     * 获取平台类型
     */
    private _getPlatform(): string {
        if (sys.isNative) {
            return 'native';
        } else if (sys.platform === sys.Platform.WECHAT_GAME) {
            return 'wechat';
        } else if (sys.isBrowser) {
            return 'web';
        }
        return 'unknown';
    }

    /**
     * 初始化存储系统
     */
    private _init(): void {
        LogMgr.info('[StorageMgr] 初始化存储系统，平台:', this._platform);
    }

    /**
     * 获取完整的键名
     */
    private _getFullKey(key: string): string {
        return `${StorageMgr.KEY_PREFIX}${key}`;
    }

    /**
     * 序列化数据
     */
    private _serialize(value: StorageValue): string {
        try {
            return JSON.stringify(value);
        } catch (e) {
            LogMgr.error('[StorageMgr] 序列化数据失败:', e);
            return '';
        }
    }

    /**
     * 反序列化数据
     */
    private _deserialize(value: string): StorageValue | null {
        try {
            return JSON.parse(value);
        } catch (e) {
            LogMgr.error('[StorageMgr] 反序列化数据失败:', e);
            return null;
        }
    }

    /**
     * 原生平台存储实现
     */
    private _nativeStorage = {
        setItem: (key: string, value: string): boolean => {
            try {
                return native.fileUtils.writeStringToFile(value, this._getNativeStoragePath(key));
            } catch (e) {
                LogMgr.error('[StorageMgr] 原生平台写入失败:', e);
                return false;
            }
        },

        getItem: (key: string): string | null => {
            try {
                const path = this._getNativeStoragePath(key);
                if (native.fileUtils.isFileExist(path)) {
                    return native.fileUtils.getStringFromFile(path);
                }
            } catch (e) {
                LogMgr.error('[StorageMgr] 原生平台读取失败:', e);
            }
            return null;
        },

        removeItem: (key: string): boolean => {
            try {
                const path = this._getNativeStoragePath(key);
                if (native.fileUtils.isFileExist(path)) {
                    return native.fileUtils.removeFile(path);
                }
                return true;
            } catch (e) {
                LogMgr.error('[StorageMgr] 原生平台删除失败:', e);
                return false;
            }
        }
    };

    /**
     * 获取原生平台存储路径
     */
    private _getNativeStoragePath(key: string): string {
        return `${native.fileUtils.getWritablePath()}storage/${key}.dat`;
    }

    /**
     * 微信小游戏存储实现
     */
    private _wechatStorage = {
        setItem: (key: string, value: string): boolean => {
            try {
                wx.setStorageSync(key, value);
                return true;
            } catch (e) {
                LogMgr.error('[StorageMgr] 微信平台写入失败:', e);
                return false;
            }
        },

        getItem: (key: string): string | null => {
            try {
                return wx.getStorageSync(key) || null;
            } catch (e) {
                LogMgr.error('[StorageMgr] 微信平台读取失败:', e);
                return null;
            }
        },

        removeItem: (key: string): boolean => {
            try {
                wx.removeStorageSync(key);
                return true;
            } catch (e) {
                LogMgr.error('[StorageMgr] 微信平台删除失败:', e);
                return false;
            }
        }
    };

    /**
     * 获取存储接口
     */
    private _getStorage() {
        switch (this._platform) {
            case 'native':
                return this._nativeStorage;
            case 'wechat':
                return this._wechatStorage;
            case 'web':
            default:
                return localStorage;
        }
    }

    /**
     * 设置数据
     */
    public set(key: string, value: StorageValue): boolean {
        try {
            const fullKey = this._getFullKey(key);
            const serializedValue = this._serialize(value);
            if (serializedValue === '') return false;

            const success = this._getStorage().setItem(fullKey, serializedValue);
            if (success) {
                this._cache.set(fullKey, value);
            }
            return success;
        } catch (e) {
            LogMgr.error('[StorageMgr] 设置数据失败:', key, e);
            return false;
        }
    }

    /**
     * 获取数据
     */
    public get<T extends StorageValue>(key: string, defaultValue?: T): T | null {
        try {
            const fullKey = this._getFullKey(key);
            
            // 先从缓存中获取
            if (this._cache.has(fullKey)) {
                return this._cache.get(fullKey) as T;
            }

            // 从存储中获取
            const value = this._getStorage().getItem(fullKey);
            if (value === null) {
                return defaultValue ?? null;
            }

            const deserializedValue = this._deserialize(value);
            if (deserializedValue !== null) {
                this._cache.set(fullKey, deserializedValue);
                return deserializedValue as T;
            }
        } catch (e) {
            LogMgr.error('[StorageMgr] 获取数据失败:', key, e);
        }
        return defaultValue ?? null;
    }

    /**
     * 删除数据
     */
    public remove(key: string): boolean {
        try {
            const fullKey = this._getFullKey(key);
            const success = this._getStorage().removeItem(fullKey);
            if (success) {
                this._cache.delete(fullKey);
            }
            return success;
        } catch (e) {
            LogMgr.error('[StorageMgr] 删除数据失败:', key, e);
            return false;
        }
    }

    /**
     * 清除所有数据
     */
    public clear(): boolean {
        try {
            const storage = this._getStorage();
            if (this._platform === 'web') {
                // Web平台：只清除带有前缀的键
                for (let i = storage.length - 1; i >= 0; i--) {
                    const key = storage.key(i);
                    if (key.startsWith(StorageMgr.KEY_PREFIX)) {
                        storage.removeItem(key);
                    }
                }
            } else {
                // 其他平台：直接清除所有数据
                if (this._platform === 'wechat') {
                    wx.clearStorageSync();
                } else {
                    // 原生平台：遍历删除所有存储文件
                    const storageDir = `${native.fileUtils.getWritablePath()}storage/`;
                    if (native.fileUtils.isDirectoryExist(storageDir)) {
                        const files = native.fileUtils.listFiles(storageDir);
                        files.forEach(file => {
                            if (file.endsWith('.dat')) {
                                native.fileUtils.removeFile(storageDir + file);
                            }
                        });
                    }
                }
            }
            this._cache.clear();
            return true;
        } catch (e) {
            LogMgr.error('[StorageMgr] 清除所有数据失败:', e);
            return false;
        }
    }
}

// 移除默认导出的单例
export { StorageMgr }; 