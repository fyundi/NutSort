import { LogMgr } from '../Log/LogMgr';
import { UIConfig, UILayer } from './UIDefine';

/**
 * UI配置装饰器
 */
export function UIWindow(config: UIConfig): ClassDecorator {
    return (target: any) => {
        // 验证配置
        if (!config.bundle || !config.path) {
            LogMgr.error(`[UIDecorator] UI配置错误: bundle和path不能为空`, target.name);
            return;
        }

        if (!Object.values(UILayer).includes(config.layer)) {
            LogMgr.error(`[UIDecorator] UI配置错误: 无效的layer`, target.name, config.layer);
            return;
        }

        // 保存UI配置到类上
        target.uiConfig = {
            bundle: config.bundle,
            path: config.path,
            layer: config.layer,
            cache: config.cache ?? false,
            touchClose: config.touchClose ?? false,
            animation: config.animation ?? false
        };

        LogMgr.debug(`[UIDecorator] UI配置完成: ${target.name}`, config);
    };
} 