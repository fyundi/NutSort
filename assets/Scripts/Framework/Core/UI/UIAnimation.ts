import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import { UIBase } from './UIBase';
import { LogMgr } from '../Log/LogMgr';

const { ccclass, property } = _decorator;

@ccclass('UIAnimation')
export class UIAnimation extends Component {
    private _uiBase: UIBase = null;
    private _root: Node = null;
    private _openCallback: Function = null;
    private _closeCallback: Function = null;

    onLoad() {
        this._uiBase = this.getComponent(UIBase);
        this._root = this.node.getChildByName('UIRoot');
        if (!this._root) {
            LogMgr.error(`[UIAnimation] ${this._uiBase?.constructor.name} 缺少UIRoot节点`);
            return;
        }
    }

    /**
     * 播放打开动画
     */
    public playEnterAnimation(callback?: Function): void {
        if (!this._root) {
            LogMgr.warn(`[UIAnimation] ${this._uiBase?.constructor.name} 无法播放打开动画：缺少UIRoot节点`);
            callback?.();
            return;
        }

        this._openCallback = callback;
        
        tween(this._root).stop();
        this._root.setScale(Vec3.ONE);

        tween(this._root)
            .to(0.06, { scale: new Vec3(1.01, 1.01, 1) })
            .to(0.08, { scale: new Vec3(0.98, 0.98, 1) })
            .to(0.04, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                if (this._openCallback) {
                    this._openCallback();
                    this._openCallback = null;
                }
                LogMgr.debug(`[UIAnimation] ${this._uiBase?.constructor.name} 打开动画完成`);
            })
            .start();
    }

    /**
     * 播放关闭动画
     */
    public playExitAnimation(callback?: Function): void {
        if (!this._root) {
            LogMgr.warn(`[UIAnimation] ${this._uiBase?.constructor.name} 无法播放关闭动画：缺少UIRoot节点`);
            callback?.();
            return;
        }

        this._closeCallback = callback;
        
        tween(this._root).stop();

        tween(this._root)
            .to(0.2, { scale: new Vec3(0.8, 0.8, 1) }, {
                easing: 'backIn'
            })
            .call(() => {
                if (this._closeCallback) {
                    this._closeCallback();
                    this._closeCallback = null;
                }
                LogMgr.debug(`[UIAnimation] ${this._uiBase?.constructor.name} 关闭动画完成`);
            })
            .start();
    }

    onDestroy() {
        if (this._root) {
            tween(this._root).stop();
        }
        this._openCallback = null;
        this._closeCallback = null;
    }
} 