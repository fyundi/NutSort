import { AssetManager, resources, JsonAsset, Prefab, SpriteFrame, AudioClip, TextAsset, ImageAsset, Asset, error, warn, log, assetManager, sys } from 'cc';

type AssetType = typeof JsonAsset | typeof Prefab | typeof SpriteFrame | typeof AudioClip | typeof TextAsset | typeof ImageAsset;

interface CacheItem {
    asset: Asset;
    refCount: number;
    lastUseTime: number;
}

export class ResourceMgr {
    private _bundleMap: Map<string, AssetManager.Bundle>;
    private _assetCache: Map<string, CacheItem>;
    private _remoteCache: Map<string, CacheItem>;

    constructor() {
        this._bundleMap = new Map<string, AssetManager.Bundle>();
        this._assetCache = new Map<string, CacheItem>();
        this._remoteCache = new Map<string, CacheItem>();
    }

    /**
     * 生成资源缓存键
     */
    private _getCacheKey(bundleName: string, path: string): string {
        return `${bundleName}:${path}`;
    }

    /**
     * 添加到缓存
     */
    private _addToCache(cache: Map<string, CacheItem>, key: string, asset: Asset): void {
        if (!cache.has(key)) {
            cache.set(key, {
                asset: asset,
                refCount: 1,
                lastUseTime: Date.now()
            });
        } else {
            const item = cache.get(key);
            item.refCount++;
            item.lastUseTime = Date.now();
        }
    }

    /**
     * 从缓存释放
     */
    private _releaseFromCache(cache: Map<string, CacheItem>, key: string): void {
        const item = cache.get(key);
        if (item) {
            item.refCount--;
            if (item.refCount <= 0) {
                assetManager.releaseAsset(item.asset);
                cache.delete(key);
            }
        }
    }

    /**
     * 加载 Bundle
     */
    public async loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        if (this._bundleMap.has(bundleName)) {
            return this._bundleMap.get(bundleName);
        }

        return new Promise((resolve) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    error(`[ResourceMgr] 加载 Bundle 失败: ${bundleName}`, err);
                    resolve(null);
                    return;
                }
                this._bundleMap.set(bundleName, bundle);
                resolve(bundle);
            });
        });
    }

    /**
     * 从 Resources 加载资源
     */
    public async loadRes<T extends Asset>(path: string, type: AssetType): Promise<T> {
        const cacheKey = this._getCacheKey('resources', path);
        const cached = this._assetCache.get(cacheKey);
        if (cached) {
            cached.refCount++;
            cached.lastUseTime = Date.now();
            return cached.asset as T;
        }

        return new Promise((resolve) => {
            resources.load(path, type, (err, asset) => {
                if (err) {
                    error(`[ResourceMgr] 从 Resources 加载失败: ${path}`, err);
                    resolve(null);
                    return;
                }
                this._addToCache(this._assetCache, cacheKey, asset);
                resolve(asset as T);
            });
        });
    }

    /**
     * 从 Bundle 加载资源
     */
    public async loadAsset<T extends Asset>(bundleName: string, path: string, type: AssetType): Promise<T> {
        const bundle = await this.loadBundle(bundleName);
        if (!bundle) {
            error(`[ResourceMgr] Bundle 不存在: ${bundleName}`);
            return null;
        }

        const cacheKey = this._getCacheKey(bundleName, path);
        const cached = this._assetCache.get(cacheKey);
        if (cached) {
            cached.refCount++;
            cached.lastUseTime = Date.now();
            return cached.asset as T;
        }

        return new Promise((resolve) => {
            bundle.load(path, type, (err, asset) => {
                if (err) {
                    error(`[ResourceMgr] 从 Bundle 加载失败: ${bundleName}:${path}`, err);
                    resolve(null);
                    return;
                }
                this._addToCache(this._assetCache, cacheKey, asset);
                resolve(asset as T);
            });
        });
    }

    /**
     * 加载远程资源
     */
    public async loadRemote<T extends Asset>(url: string, options?: Record<string, any>): Promise<T> {
        const cached = this._remoteCache.get(url);
        if (cached) {
            cached.refCount++;
            cached.lastUseTime = Date.now();
            return cached.asset as T;
        }

        return new Promise((resolve) => {
            assetManager.loadRemote(url, options, (err, asset) => {
                if (err) {
                    error(`[ResourceMgr] 加载远程资源失败: ${url}`, err);
                    resolve(null);
                    return;
                }
                this._addToCache(this._remoteCache, url, asset);
                resolve(asset as T);
            });
        });
    }

    /**
     * 释放资源
     */
    public release(bundleName: string, path: string): void {
        const cacheKey = this._getCacheKey(bundleName, path);
        this._releaseFromCache(this._assetCache, cacheKey);
    }

    /**
     * 释放远程资源
     */
    public releaseRemote(url: string): void {
        this._releaseFromCache(this._remoteCache, url);
    }

    /**
     * 释放 Bundle
     */
    public releaseBundle(bundleName: string): void {
        const bundle = this._bundleMap.get(bundleName);
        if (bundle) {
            // 释放该 Bundle 下所有缓存的资源
            const prefix = `${bundleName}:`;
            for (const [key] of this._assetCache) {
                if (key.startsWith(prefix)) {
                    this.release(bundleName, key.slice(prefix.length));
                }
            }

            bundle.releaseAll();
            assetManager.removeBundle(bundle);
            this._bundleMap.delete(bundleName);
            log(`[ResourceMgr] 释放 Bundle: ${bundleName}`);
        }
    }

    /**
     * 释放所有资源
     */
    public releaseAll(): void {
        // 释放所有缓存的资源
        this._assetCache.forEach((item) => {
            assetManager.releaseAsset(item.asset);
        });
        this._assetCache.clear();

        // 释放所有远程资源
        this._remoteCache.forEach((item) => {
            assetManager.releaseAsset(item.asset);
        });
        this._remoteCache.clear();

        // 释放所有 Bundle
        this._bundleMap.forEach((bundle) => {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
        });
        this._bundleMap.clear();

        // 释放 Resources 资源
        resources.releaseAll();

        if (sys.isNative) {
            //@ts-ignore
            sys.__garbageCollect();
        }
    }

    /**
     * 自动清理长时间未使用的资源
     * @param timeout 超时时间（毫秒）
     */
    public gc(timeout: number = 300000): void {
        const now = Date.now();
        
        // 清理普通资源缓存
        for (const [key, item] of this._assetCache) {
            if (now - item.lastUseTime > timeout && item.refCount <= 1) {
                this.release(key.split(':')[0], key.split(':')[1]);
            }
        }

        // 清理远程资源缓存
        for (const [url, item] of this._remoteCache) {
            if (now - item.lastUseTime > timeout && item.refCount <= 1) {
                this.releaseRemote(url);
            }
        }
    }
} 