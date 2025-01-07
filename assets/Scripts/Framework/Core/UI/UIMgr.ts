import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { UIBase } from './UIBase';
import { UILayer, UIState } from './UIDefine';
import { LogMgr } from '../Log/LogMgr';
import { App } from '../App';

interface UIInfo {
    ui: UIBase;
    state: UIState;
    prefab?: Prefab;
    resKey?: string;  // 添加资源key用于释放
}

export class UIMgr {
    private _layers: Map<UILayer, Node> = new Map();
    private _uiMap: Map<string, UIInfo> = new Map();
    private _loadingUI: Set<string> = new Set();
    private _uiStacks: Map<UILayer, string[]> = new Map();
    private _canvas: Node = null;
    
    // 定义层级顺序
    private readonly _layerOrder: UILayer[] = [
        UILayer.Scene,
        UILayer.Base,
        UILayer.Middle,
        UILayer.Popup,
        UILayer.Top,
        UILayer.Notify
    ];

    constructor(canvas: Node) {
        this._canvas = canvas;
        this._initLayers();
    }

    /**
     * 初始化UI层级节点
     */
    private _initLayers(): void {
        // 创建各层级节点
        for (const layer of this._layerOrder) {
            const node = new Node(layer);
            node.parent = this._canvas;
            this._layers.set(layer, node);
            this._uiStacks.set(layer, []);
        }
    }

    /**
     * 获取UI类名
     */
    private _getUIName(uiClass: new () => UIBase): string {
        return uiClass.name;
    }

    /**
     * 获取UI信息
     */
    private _getUIInfo(uiName: string): UIInfo | null {
        return this._uiMap.get(uiName);
    }

    /**
     * 检查数组中是否包含元素
     */
    private _arrayIncludes<T>(arr: T[], item: T): boolean {
        return arr.indexOf(item) !== -1;
    }

    /**
     * 加载UI预制体
     */
    private async _loadUIPrefab(bundle: string, path: string): Promise<Prefab> {
        try {
            const prefab = await App.res.loadAsset<Prefab>(bundle, path, Prefab);
            if (!prefab) {
                LogMgr.error(`[UIMgr] 加载UI预制体失败: ${bundle}/${path}`);
                return null;
            }
            return prefab;
        } catch (err) {
            LogMgr.error('[UIMgr] 加载UI预制体异常:', bundle, path, err);
            return null;
        }
    }

    /**
     * 创建UI实例
     */
    private _createUIInstance(prefab: Prefab, uiClass: new () => UIBase): UIBase {
        const node = instantiate(prefab);
        const ui = node.getComponent(uiClass) || node.addComponent(uiClass);
        return ui;
    }

    /**
     * 关闭高层级UI
     */
    private async _closeHigherLayerUIs(targetLayer: UILayer): Promise<void> {
        const targetIndex = this._layerOrder.indexOf(targetLayer);
        
        // 关闭所有更高层级的UI
        for (let i = this._layerOrder.length - 1; i > targetIndex; i--) {
            const layer = this._layerOrder[i];
            const stack = this._uiStacks.get(layer);
            if (!stack) continue;

            // 从后向前关闭UI
            for (let j = stack.length - 1; j >= 0; j--) {
                const uiName = stack[j];
                await this.closeUI(uiName);
            }
        }
    }

    /**
     * 异步打开UI
     */
    public async openUI<T extends UIBase>(
        uiClass: new () => T,
        params?: any
    ): Promise<T | null> {
        const uiName = this._getUIName(uiClass);
        
        if (this._loadingUI.has(uiName)) {
            LogMgr.warn(`[UIMgr] UI正在加载中: ${uiName}`);
            return null;
        }

        let uiInfo = this._getUIInfo(uiName);
        if (uiInfo) {
            if (uiInfo.state === UIState.Showing) {
                uiInfo.ui.enter(params);
                return uiInfo.ui as T;
            }
        }

        try {
            this._loadingUI.add(uiName);

            const config = uiClass.prototype.constructor.uiConfig;
            if (!config || !config.path || !config.bundle) {
                LogMgr.error(`[UIMgr] UI配置无效: ${uiName}`);
                return null;
            }

            await this._closeHigherLayerUIs(config.layer);

            let prefab: Prefab;
            if (uiInfo?.prefab) {
                prefab = uiInfo.prefab;
            } else {
                prefab = await this._loadUIPrefab(config.bundle, config.path);
                if (!prefab) {
                    return null;
                }
            }

            const ui = this._createUIInstance(prefab, uiClass);
            const layer = this._layers.get(config.layer);
            ui.node.parent = layer;

            ui.init(params);

            // 缓存key使用bundle:path格式
            const cacheKey = `${config.bundle}:${config.path}`;
            this._uiMap.set(uiName, {
                ui,
                state: UIState.Showing,
                prefab: config.cache ? prefab : null,
                resKey: cacheKey
            });

            const stack = this._uiStacks.get(config.layer);
            const stackIndex = stack.indexOf(uiName);
            if (stackIndex !== -1) {
                stack.splice(stackIndex, 1);
            }
            stack.push(uiName);

            ui.enter(params);
            LogMgr.info(`[UIMgr] 打开UI: ${uiName}`);

            return ui as T;
        } catch (err) {
            LogMgr.error(`[UIMgr] 打开UI异常: ${uiName}`, err);
            return null;
        } finally {
            this._loadingUI.delete(uiName);
        }
    }

    /**
     * 关闭UI
     */
    public async closeUI(uiNameOrClass: string | (new () => UIBase)): Promise<void> {
        const uiName = typeof uiNameOrClass === 'string' ? 
            uiNameOrClass : this._getUIName(uiNameOrClass);

        const uiInfo = this._getUIInfo(uiName);
        if (!uiInfo) return;

        const { ui, state } = uiInfo;
        if (state === UIState.Hiding) return;

        uiInfo.state = UIState.Hiding;
        ui.exit();

        const config = ui.config;
        const stack = this._uiStacks.get(config.layer);
        const index = stack.indexOf(uiName);
        if (index !== -1) {
            stack.splice(index, 1);
        }

        if (!config.cache) {
            // 销毁UI节点
            ui.node.destroy();
            
            // 释放预制体资源
            if (uiInfo.resKey) {
                const [bundle, path] = uiInfo.resKey.split(':');
                App.res.release(bundle, path);
                uiInfo.prefab = null;
                uiInfo.resKey = null;
            }
            
            this._uiMap.delete(uiName);
        }
    }

    /**
     * 获取当前显示的UI
     */
    public getUI<T extends UIBase>(uiClass: new () => T): T | null {
        const uiName = this._getUIName(uiClass);
        const uiInfo = this._getUIInfo(uiName);
        return uiInfo?.ui as T;
    }

    /**
     * 获取指定层级的顶部UI
     */
    public getTopUI(layer: UILayer): UIBase | null {
        const stack = this._uiStacks.get(layer);
        if (!stack || stack.length === 0) return null;

        const uiName = stack[stack.length - 1];
        const uiInfo = this._getUIInfo(uiName);
        return uiInfo?.ui;
    }

    /**
     * 清理所有UI
     */
    public async clearAll(): Promise<void> {
        // 获取所有UI名称
        const uiNames: string[] = [];
        this._uiMap.forEach((_, name) => uiNames.push(name));

        // 关闭所有UI
        for (const uiName of uiNames) {
            await this.closeUI(uiName);
        }

        // 清理缓存
        this._uiMap.clear();
        this._loadingUI.clear();
        
        // 清空所有层级的UI栈
        for (const layer of this._layerOrder) {
            const stack = this._uiStacks.get(layer);
            if (stack) {
                stack.length = 0;
            }
        }
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.clearAll();
        this._layers.clear();
        this._uiStacks.clear();
        this._canvas = null;
    }
} 