import { App } from "../../Framework/Core/App";
import { IModel } from "../../Framework/Core/Model/IModel";

export interface IUserData {
    uid: string;                    // 用户唯一ID
    nickname: string;               // 昵称
    level: number;                  // 当前关卡
    stars: number;                  // 星星数量
    coins: number;                  // 金币数量
    items: { [key: string]: number }; // 道具数量
    createTime: number;             // 创建时间
    lastLoginTime: number;          // 最后登录时间
}

export class UserModel implements IModel {
    private static readonly STORAGE_KEY = 'user_data';
    private _data: IUserData = null;
    
    public get data(): IUserData {
        return this._data;
    }

    public async init(): Promise<void> {
        const savedData = await App.storage.get(UserModel.STORAGE_KEY);
        this._data = savedData ? JSON.parse(savedData as string) : this.createNewUser();
        await this.save();
    }

    private createNewUser(): IUserData {
        return {
            uid: this.generateUid(),
            nickname: "Player",
            level: 1,
            stars: 0,
            coins: 0,
            items: {},
            createTime: Date.now(),
            lastLoginTime: Date.now()
        };
    }

    private generateUid(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    public async save(): Promise<void> {
        await App.storage.set(UserModel.STORAGE_KEY, JSON.stringify(this._data));
    }

    public clear(): void {
        this._data = null;
    }
}
