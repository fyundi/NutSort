/**
 * UI层级定义
 */
export enum UILayer {
    Scene = "SceneLayer",      // 场景层：场景内UI
    Base = "BaseLayer",        // 基础层：全屏界面
    Middle = "MiddleLayer",    // 中间层：Loading等
    Popup = "PopupLayer",      // 弹出层：弹窗
    Top = "TopLayer",         // 顶层：新手引导
    Notify = "NotifyLayer"    // 通知层：系统通知、断线提示
}

/**
 * UI配置接口
 */
export interface UIConfig {
    bundle: string;           // bundle名称
    path: string;            // 预制体路径
    layer: UILayer;          // UI层级
    cache?: boolean;         // 是否缓存
    touchClose?: boolean;    // 点击背景是否关闭（默认false）
    animation?: boolean;     // 是否启用弹窗动画（默认false）
}

/**
 * UI状态
 */
export enum UIState {
    None = "None",           // 未创建
    Loading = "Loading",     // 加载中
    Ready = "Ready",        // 已准备
    Showing = "Showing",    // 显示中
    Hiding = "Hiding"       // 隐藏中
} 