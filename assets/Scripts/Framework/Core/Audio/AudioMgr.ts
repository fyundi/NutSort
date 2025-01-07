import { AudioClip, AudioSource, Node, game, director } from 'cc';
import { App } from '../App';
import { LogMgr } from '../Log/LogMgr';

export class AudioMgr {
    private _bgmNode: Node = null;
    private _bgmSource: AudioSource = null;
    private _bgmClip: AudioClip = null;
    private _bgmVolume: number = 1;
    private _effectVolume: number = 1;
    private _isBgmMuted: boolean = false;
    private _isEffectMuted: boolean = false;
    private _effectNodes: Map<string, Node> = new Map();

    constructor() {
        this._init();
        this._registerGameEvent();
    }

    private _init(): void {
        // 创建背景音乐节点
        this._bgmNode = new Node('BGMNode');
        director.getScene()?.addChild(this._bgmNode);
        this._bgmSource = this._bgmNode.addComponent(AudioSource);
        this._bgmSource.loop = true;

        // 恢复保存的音量设置
        this._bgmVolume = parseFloat(App.storage.get('bgmVolume') || '1');
        this._effectVolume = parseFloat(App.storage.get('effectVolume') || '1');
        this._isBgmMuted = App.storage.get('bgmMuted') === 'true';
        this._isEffectMuted = App.storage.get('effectMuted') === 'true';

        this._updateBgmVolume();
    }

    private _registerGameEvent(): void {
        // 监听游戏隐藏事件
        game.on(game.EVENT_HIDE, this._onGameHide, this);
        game.on(game.EVENT_SHOW, this._onGameShow, this);
    }

    private _onGameHide(): void {
        if (this._bgmSource) {
            this._bgmSource.pause();
        }
    }

    private _onGameShow(): void {
        if (this._bgmSource?.clip && !this._isBgmMuted) {
            this._bgmSource.play();
        }
    }

    private _updateBgmVolume(): void {
        if (this._bgmSource) {
            this._bgmSource.volume = this._isBgmMuted ? 0 : this._bgmVolume;
        }
    }

    /**
     * 播放背景音乐
     */
    public async playBGM(bundle: string, path: string): Promise<void> {
        if (this._bgmClip?.name === path) {
            if (!this._bgmSource.playing) {
                this._bgmSource.play();
            }
            return;
        }

        try {
            const clip = await App.res.loadAsset<AudioClip>(bundle, path, AudioClip);
            if (!clip) {
                LogMgr.warn('[AudioMgr] 背景音乐加载失败:', path);
                return;
            }

            // 停止当前音乐
            this.stopBGM();

            // 播放新音乐
            this._bgmClip = clip;
            this._bgmSource.clip = clip;
            this._bgmSource.play();
            LogMgr.debug('[AudioMgr] 播放背景音乐:', path);
        } catch (err) {
            LogMgr.error('[AudioMgr] 播放背景音乐异常:', path, err);
        }
    }

    /**
     * 播放音效
     */
    public async playEffect(bundle: string, path: string): Promise<void> {
        if (this._isEffectMuted) return;

        try {
            const clip = await App.res.loadAsset<AudioClip>(bundle, path, AudioClip);
            if (!clip) {
                LogMgr.warn('[AudioMgr] 音效加载失败:', path);
                return;
            }

            // 创建音效节点
            const node = new Node('EffectNode');
            director.getScene()?.addChild(node);
            const source = node.addComponent(AudioSource);
            source.clip = clip;
            source.loop = false;
            source.volume = this._effectVolume;
            source.play();

            // 记录音效节点
            this._effectNodes.set(path, node);

            // 播放完成后清理
            source.node.once(AudioSource.EventType.ENDED, () => {
                App.res.release(bundle, path);
                node.destroy();
                this._effectNodes.delete(path);
            });

            LogMgr.debug('[AudioMgr] 播放音效:', path);
        } catch (err) {
            LogMgr.error('[AudioMgr] 播放音效异常:', path, err);
        }
    }

    /**
     * 停止背景音乐
     */
    public stopBGM(): void {
        if (this._bgmSource.playing) {
            this._bgmSource.stop();
        }

        if (this._bgmClip) {
            const bundle = this._bgmClip._uuid?.split('@')[0] || 'resources';
            App.res.release(bundle, this._bgmClip.name);
            this._bgmClip = null;
            this._bgmSource.clip = null;
        }
    }

    /**
     * 停止指定音效
     */
    public stopEffect(path: string): void {
        const node = this._effectNodes.get(path);
        if (node) {
            const source = node.getComponent(AudioSource);
            if (source) {
                source.stop();
                const bundle = source.clip._uuid?.split('@')[0] || 'resources';
                App.res.release(bundle, path);
            }
            node.destroy();
            this._effectNodes.delete(path);
        }
    }

    /**
     * 停止所有音效
     */
    public stopAllEffects(): void {
        this._effectNodes.forEach((node, path) => {
            this.stopEffect(path);
        });
    }

    /**
     * 设置背景音乐音量
     */
    public setBgmVolume(volume: number): void {
        this._bgmVolume = Math.max(0, Math.min(1, volume));
        this._updateBgmVolume();
        App.storage.set('bgmVolume', this._bgmVolume.toString());
    }

    /**
     * 设置音效音量
     */
    public setEffectVolume(volume: number): void {
        this._effectVolume = Math.max(0, Math.min(1, volume));
        this._effectNodes.forEach(node => {
            const source = node.getComponent(AudioSource);
            if (source) {
                source.volume = this._effectVolume;
            }
        });
        App.storage.set('effectVolume', this._effectVolume.toString());
    }

    /**
     * 设置背景音乐静音
     */
    public muteBgm(muted: boolean): void {
        this._isBgmMuted = muted;
        this._updateBgmVolume();
        App.storage.set('bgmMuted', this._isBgmMuted.toString());
    }

    /**
     * 设置音效静音
     */
    public muteEffect(muted: boolean): void {
        this._isEffectMuted = muted;
        if (muted) {
            this.stopAllEffects();
        }
        App.storage.set('effectMuted', this._isEffectMuted.toString());
    }

    /**
     * 清理音频
     */
    public clear(): void {
        this.stopBGM();
        this.stopAllEffects();
        
        if (this._bgmNode) {
            this._bgmNode.destroy();
            this._bgmNode = null;
            this._bgmSource = null;
        }

        game.off(game.EVENT_HIDE, this._onGameHide, this);
        game.off(game.EVENT_SHOW, this._onGameShow, this);
    }
} 