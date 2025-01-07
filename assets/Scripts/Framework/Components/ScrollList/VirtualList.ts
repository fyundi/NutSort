import { _decorator, Component, Node, ScrollView, Prefab, UITransform, Vec3, instantiate, Size } from 'cc';
import { LogMgr } from '../../Core/Log/LogMgr';

const { ccclass, property } = _decorator;

interface ListItem {
    node: Node;
    index: number;
}

@ccclass('VirtualList')
export class VirtualList extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Prefab)
    itemPrefab: Prefab = null;

    @property
    spacing: number = 5;

    @property
    topPadding: number = 0;

    @property
    bottomPadding: number = 0;

    private _itemPool: Node[] = [];
    private _items: ListItem[] = [];
    private _itemHeight: number = 0;
    private _totalCount: number = 0;
    private _content: Node = null;
    private _contentHeight: number = 0;
    private _viewHeight: number = 0;
    private _maxItemCount: number = 0;
    private _updateCallback: (node: Node, index: number) => void = null;

    onLoad() {
        if (!this.scrollView || !this.itemPrefab) {
            LogMgr.error('[VirtualList] ScrollView或ItemPrefab未设置');
            return;
        }

        this._content = this.scrollView.content;
        const tempItem = instantiate(this.itemPrefab);
        this._itemHeight = tempItem.getComponent(UITransform).height;
        tempItem.destroy();

        this._viewHeight = this.scrollView.node.getComponent(UITransform).height;
        this._maxItemCount = Math.ceil(this._viewHeight / this._itemHeight) + 2;

        this.scrollView.node.on('scrolling', this._onScrolling, this);
    }

    /**
     * 设置列表数据
     * @param totalCount 总数据条数
     * @param updateCallback 更新回调
     */
    public setData(totalCount: number, updateCallback: (node: Node, index: number) => void): void {
        this._totalCount = totalCount;
        this._updateCallback = updateCallback;

        // 计算内容高度
        this._contentHeight = this.topPadding + this.bottomPadding + 
            totalCount * this._itemHeight + (totalCount - 1) * this.spacing;
        this._content.getComponent(UITransform).setContentSize(new Size(
            this._content.getComponent(UITransform).width,
            this._contentHeight
        ));

        // 初始化显示
        this._items = [];
        this._initItems();
        this._onScrolling();
    }

    private _initItems(): void {
        // 回收所有节点到对象池
        this._items.forEach(item => {
            this._itemPool.push(item.node);
            item.node.active = false;
        });
        this._items = [];

        // 创建初始可见节点
        const count = Math.min(this._maxItemCount, this._totalCount);
        for (let i = 0; i < count; i++) {
            const node = this._getItemNode();
            node.active = true;
            this._items.push({
                node: node,
                index: i
            });
            this._updateItem(this._items[i]);
        }
    }

    private _getItemNode(): Node {
        let node: Node = null;
        if (this._itemPool.length > 0) {
            node = this._itemPool.pop();
        } else {
            node = instantiate(this.itemPrefab);
            node.parent = this._content;
        }
        return node;
    }

    private _updateItem(item: ListItem): void {
        const y = -this.topPadding - item.index * (this._itemHeight + this.spacing) - this._itemHeight / 2;
        item.node.setPosition(new Vec3(item.node.position.x, y, 0));
        if (this._updateCallback) {
            this._updateCallback(item.node, item.index);
        }
    }

    private _onScrolling(): void {
        if (this._items.length === 0) return;

        const offsetY = this._content.position.y;
        const startIndex = Math.floor((-offsetY - this.topPadding) / (this._itemHeight + this.spacing));
        
        // 检查是否需要更新项目
        let firstItem = this._items[0];
        let lastItem = this._items[this._items.length - 1];

        // 向上滚动
        while (firstItem.index > startIndex && firstItem.index > 0) {
            lastItem = this._items.pop();
            this._items.unshift(lastItem);
            lastItem.index = firstItem.index - 1;
            this._updateItem(lastItem);
            firstItem = lastItem;
        }

        // 向下滚动
        while (lastItem.index < startIndex + this._maxItemCount - 1 && lastItem.index < this._totalCount - 1) {
            firstItem = this._items.shift();
            this._items.push(firstItem);
            firstItem.index = lastItem.index + 1;
            this._updateItem(firstItem);
            lastItem = firstItem;
        }
    }

    /**
     * 刷新指定索引的项目
     */
    public refreshItem(index: number): void {
        const item = this._items.find(item => item.index === index);
        if (item) {
            this._updateCallback?.(item.node, index);
        }
    }

    /**
     * 刷新所有可见项目
     */
    public refreshVisibleItems(): void {
        this._items.forEach(item => {
            this._updateCallback?.(item.node, item.index);
        });
    }

    /**
     * 滚动到指定索引
     */
    public scrollToIndex(index: number, time: number = 0): void {
        const y = this.topPadding + index * (this._itemHeight + this.spacing);
        this.scrollView.scrollToOffset(new Vec3(0, y, 0), time);
    }

    onDestroy() {
        this.scrollView.node.off('scrolling', this._onScrolling, this);
        this._items.forEach(item => item.node.destroy());
        this._itemPool.forEach(node => node.destroy());
        this._items = [];
        this._itemPool = [];
    }
} 