import { Button, Node, tween, Vec3, EventHandler } from 'cc';
import { App } from '../Core/App';
import { LogMgr } from '../Core/Log/LogMgr';
import { VibrateMgr, VibrateType } from '../Core/Device/VibrateMgr';

export interface ButtonConfig {
    sound?: {
        enable?: boolean;
        bundle?: string;
        path?: string;
    };
    vibrate?: {
        enable?: boolean;
        type?: VibrateType;
    };
    scale?: {
        enable?: boolean;
        duration?: number;
        ratio?: number;
    };
}

export class UIButton {
    private static readonly DEFAULT_CONFIG: ButtonConfig = {
        sound: {
            enable: true,
            bundle: 'resources',
            path: 'audio/click'
        },
        vibrate: {
            enable: true,
            type: VibrateType.Light
        },
        scale: {
            enable: true,
            duration: 0.1,
            ratio: 0.9
        }
    };

    /**
     * 添加按钮点击事件
     */
    public static AddButtonListener(
        button: Button | Node,
        callback: () => void,
        config?: ButtonConfig
    ): void {
        const node = button instanceof Button ? button.node : button;
        const btnComp = button instanceof Button ? button : button.getComponent(Button);
        
        if (!btnComp) {
            LogMgr.warn('[UIButton] 节点缺少Button组件');
            return;
        }

        const finalConfig = this._mergeConfig(config);
        const originalScale = node.scale.clone();
        let isScaling = false;

        // 注册触摸事件
        node.on(Node.EventType.TOUCH_START, () => {
            if (!btnComp.interactable) return;
            
            if (finalConfig.scale.enable) {
                this._playScaleAnimation(node, finalConfig.scale.ratio, finalConfig.scale.duration / 2);
                isScaling = true;
            }
        });

        node.on(Node.EventType.TOUCH_END, () => {
            if (!btnComp.interactable) return;

            if (finalConfig.scale.enable && isScaling) {
                this._playScaleAnimation(node, 1, finalConfig.scale.duration / 2, originalScale);
                isScaling = false;
            }

            // 播放音效
            if (finalConfig.sound.enable) {
                App.audio.playEffect(
                    finalConfig.sound.bundle,
                    finalConfig.sound.path
                );
            }

            // 触发震动
            if (finalConfig.vibrate.enable) {
                VibrateMgr.instance.vibrate(finalConfig.vibrate.type);
            }

            // 执行回调
            callback?.();
        });

        node.on(Node.EventType.TOUCH_CANCEL, () => {
            if (finalConfig.scale.enable && isScaling) {
                this._playScaleAnimation(node, 1, finalConfig.scale.duration / 2, originalScale);
                isScaling = false;
            }
        });
    }

    /**
     * 合并配置
     */
    private static _mergeConfig(config: ButtonConfig): ButtonConfig {
        return {
            sound: { ...this.DEFAULT_CONFIG.sound, ...config?.sound },
            vibrate: { ...this.DEFAULT_CONFIG.vibrate, ...config?.vibrate },
            scale: { ...this.DEFAULT_CONFIG.scale, ...config?.scale }
        };
    }

    /**
     * 播放缩放动画
     */
    private static _playScaleAnimation(
        node: Node,
        targetScale: number,
        duration: number,
        originalScale?: Vec3
    ): void {
        tween(node)
            .to(duration, {
                scale: new Vec3(
                    targetScale * (originalScale?.x || 1),
                    targetScale * (originalScale?.y || 1),
                    1
                )
            })
            .start();
    }
} 