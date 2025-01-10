import { App } from "../../Framework/Core/App";
import { IModel } from "../../Framework/Core/Model/IModel";

export interface ISettingData {
    audio: {
        bgmOn: boolean;       // 背景音乐开关
        bgmVolume: number;    // 背景音乐音量
        sfxOn: boolean;       // 音效开关
        sfxVolume: number;    // 音效音量
    };
    vibrate: boolean;         // 震动开关
    language: string;         // 语言设置
    tutorial: {
        completed: boolean;   // 新手引导是否完成
        steps: number[];      // 已完成的引导步骤
    };
    notification: boolean;    // 通知开关
}

export class SettingModel implements IModel {
    private static readonly STORAGE_KEY = 'setting_data';
    private _data: ISettingData = null;

    public get data(): ISettingData {
        return this._data;
    }

    public async init(): Promise<void> {
        const savedData = await App.storage.get(SettingModel.STORAGE_KEY);
        this._data = savedData ? JSON.parse(savedData as string) : this.getDefaultSettings();
        await this.save();
        
        // 应用设置
        this.applySettings();
    }

    private getDefaultSettings(): ISettingData {
        return {
            audio: {
                bgmOn: true,
                bgmVolume: 0.7,
                sfxOn: true,
                sfxVolume: 1.0
            },
            vibrate: true,
            language: 'zh',
            tutorial: {
                completed: false,
                steps: []
            },
            notification: true
        };
    }

    private applySettings(): void {
        // 应用音频设置
        App.audio.setBgmVolume(this._data.audio.bgmVolume);
        App.audio.muteBgm(!this._data.audio.bgmOn);
        App.audio.setEffectVolume(this._data.audio.sfxVolume);
        App.audio.muteEffect(!this._data.audio.sfxOn);
    }

    public async save(): Promise<void> {
        await App.storage.set(SettingModel.STORAGE_KEY, JSON.stringify(this._data));
    }

    public clear(): void {
        this._data = null;
    }
}
