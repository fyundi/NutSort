import { _decorator, Component, Node } from 'cc';
import { App } from './Framework/Core/App';
import { UserModel } from './Game/Model/UserModel';
import { LevelModel } from './Game/Level/Core/LevelModel';
import { SettingModel } from './Game/Model/SettingModel';
import { director } from 'cc';
import { LevelMgr } from './Game/Level/Core/LevelMgr';

const { ccclass, property } = _decorator;

@ccclass('Entrance')
export class Entrance extends Component {
    onLoad() {
        director.addPersistRootNode(this.node);
    }

    start() {
        this.initModels();
        this.initMgrs();
    }

    onDestroy() {
        App.model.clear();
    }

    private initModels() {
        App.model.register<UserModel>('UserModel', UserModel);
        App.model.register<LevelModel>('LevelModel', LevelModel);
        App.model.register<SettingModel>('SettingModel', SettingModel);
    }
    
    private initMgrs() {
        LevelMgr.Instance.initialize();
    }
}
