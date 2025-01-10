export interface IModel {
    init?(): Promise<void>;
    clear?(): void;
    save?(): void;
}