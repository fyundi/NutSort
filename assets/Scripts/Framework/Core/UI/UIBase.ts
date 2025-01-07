import { _decorator, Component, Node, UITransform, Widget } from 'cc';
import { UIConfig } from './UIDefine';
import { LogMgr } from '../Log/LogMgr';

const { ccclass, property } = _decorator;

@ccclass('UIBase')
export class UIBase extends Component {
    protected _config: UIConfig;
    protected _binds: Map<string, Node | Component> = new Map();
    protected _params: any;

    /**
     * 获取UI配置
     */
    public get config(): UIConfig {
        if (!this._config) {
            this._config = (this.constructor as any).uiConfig;
            if (!this._config) {
                LogMgr.error(`[UIBase] ${this.constructor.name} 未配置uiConfig`);
            }
        }
        return this._config;
    }

    /**
     * UI初始化
     */
    public init(params?: any): void {
        this._params = params;
        this._initSize();
        this._autoBindNodes();
        this.onInit();
        LogMgr.debug(`[UIBase] ${this.constructor.name} 初始化完成`);
    }

    /**
     * 初始化UI尺寸
     */
    private _initSize(): void {
        const transform = this.getComponent(UITransform);
        if (!transform) {
            LogMgr.warn(`[UIBase] ${this.constructor.name} 缺少UITransform组件`);
            return;
        }

        const widget = this.getComponent(Widget) || this.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        widget.updateAlignment();
    }

    /**
     * 自动绑定节点
     */
    private _autoBindNodes(): void {
        // 预留给自动绑定工具实现
    }

    /**
     * 子类可重写的初始化方法
     */
    protected onInit(): void {}

    /**
     * 显示UI
     */
    public enter(params?: any): void {
        if (params !== undefined) {
            this._params = params;
        }
        this.onEnter();
        LogMgr.debug(`[UIBase] ${this.constructor.name} 显示`);
    }

    /**
     * 隐藏UI
     */
    public exit(): void {
        this.onExit();
        LogMgr.debug(`[UIBase] ${this.constructor.name} 隐藏`);
    }

    /**
     * 子类可重写的显示方法
     */
    protected onEnter(): void {}

    /**
     * 子类可重写的隐藏方法
     */
    protected onExit(): void {}

    /**
     * 销毁UI
     */
    protected onDestroy(): void {
        this._binds.clear();
        this._params = null;
        LogMgr.debug(`[UIBase] ${this.constructor.name} 销毁`);
    }

    /**
     * 关闭UI
     */
    public close(): void {
        LogMgr.debug(`[UIBase] ${this.constructor.name} 关闭`);
    }
} 