import { _decorator, Component, Node } from 'cc';
import { StorageMgr } from './Storage/StorageMgr';
import { ResourceMgr } from './Res/ResourceMgr';
import { UIMgr } from './UI/UIMgr';
import { TimerMgr } from './Timer/TimerMgr';
import { AudioMgr } from './Audio/AudioMgr';
import { EventMgr } from './Event/EventMgr';
import { ModelMgr } from './Model/ModelMgr';

const { ccclass, property } = _decorator;

@ccclass('App')
export class App extends Component {
    private static _instance: App = null;
    private _eventMgr: EventMgr = null;
    private _storageMgr: StorageMgr = null;
    private _audioMgr: AudioMgr = null;
    private _timerMgr: TimerMgr = null;
    private _resourceMgr: ResourceMgr = null;
    private _uiMgr: UIMgr = null;
    private _modelMgr: ModelMgr = null;

    public static get instance(): App {
        return this._instance;
    }

    public static get event(): EventMgr {
        return this._instance?._eventMgr;
    }

    public static get storage(): StorageMgr {
        return this._instance?._storageMgr;
    }

    public static get audio(): AudioMgr {
        return this._instance?._audioMgr;
    }

    public static get timer(): TimerMgr {
        return this._instance?._timerMgr;
    }

    public static get res(): ResourceMgr {
        return this._instance?._resourceMgr;
    }

    public static get ui(): UIMgr {
        return this._instance?._uiMgr;
    }

    public static get model(): ModelMgr {
        return this._instance?._modelMgr;
    }

    onLoad() {
        if (App._instance) {
            this.node.destroy();
            return;
        }
        
        App._instance = this;
        this.node.name = "App";
        this._init();
    }

    private _init(): void {
        this._eventMgr = new EventMgr();
        this._storageMgr = new StorageMgr();
        this._audioMgr = new AudioMgr();
        this._timerMgr = new TimerMgr();
        this._resourceMgr = new ResourceMgr();
        this._modelMgr = new ModelMgr();
        this._uiMgr = new UIMgr(this.node);
    }

    onDestroy() {
        if (App._instance === this) {
            if (this._audioMgr) {
                this._audioMgr.clear();
            }
            if (this._timerMgr) {
                this._timerMgr.destroy();
            }
            if (this._uiMgr) {
                this._uiMgr.destroy();
            }
            App._instance = null;
        }
    }
}