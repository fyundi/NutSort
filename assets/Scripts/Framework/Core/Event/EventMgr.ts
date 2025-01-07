import { _decorator } from 'cc';

interface IEventListener {
    callback: Function;
    target: any;
    once: boolean;
}

export class EventMgr {
    private _eventMap: Map<string, IEventListener[]>;

    constructor() {
        this._eventMap = new Map<string, IEventListener[]>();
    }

    public on(eventName: string, callback: Function, target?: any, once: boolean = false): void {
        let listeners = this._eventMap.get(eventName);
        if (!listeners) {
            listeners = [];
            this._eventMap.set(eventName, listeners);
        }

        for (let listener of listeners) {
            if (listener.callback === callback && listener.target === target) {
                return;
            }
        }

        listeners.push({ callback, target, once });
    }

    public once(eventName: string, callback: Function, target?: any): void {
        this.on(eventName, callback, target, true);
    }

    public off(eventName: string, callback?: Function, target?: any): void {
        let listeners = this._eventMap.get(eventName);
        if (!listeners) return;

        if (!callback) {
            this._eventMap.delete(eventName);
            return;
        }

        for (let i = listeners.length - 1; i >= 0; i--) {
            let listener = listeners[i];
            if (listener.callback === callback && (!target || listener.target === target)) {
                listeners.splice(i, 1);
            }
        }

        if (listeners.length === 0) {
            this._eventMap.delete(eventName);
        }
    }

    public emit(eventName: string, ...args: any[]): void {
        let listeners = this._eventMap.get(eventName);
        if (!listeners) return;

        listeners = [...listeners];

        for (let listener of listeners) {
            if (listener.target) {
                listener.callback.apply(listener.target, args);
            } else {
                listener.callback(...args);
            }

            if (listener.once) {
                this.off(eventName, listener.callback, listener.target);
            }
        }
    }

    public clear(): void {
        this._eventMap.clear();
    }
} 