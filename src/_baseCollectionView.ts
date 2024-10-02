import type { CollectionLike } from "../_imports/collection";
import type { BaseCollectionViewOptions } from "../_imports/collectionView";
import { debounce } from "../util/throttle";
import BaseView from "./_baseView";
import type ApplicationCore from "./app";

const collectionViewEvents = [
  "change", // General event whenever the size of our collection changes. More granular events available on the collection itself.
];

export default class CollectionView<
  C extends CollectionLike = CollectionLike
> extends BaseView {
  declare options: BaseCollectionViewOptions<C>;

  collection: C | undefined;
  protected childView?: typeof BaseView;
  private childItems: BaseView[] = [];

  constructor(options: BaseCollectionViewOptions<C>, app: ApplicationCore) {
    super(
      {
        ...options,
        customEvents: collectionViewEvents,
      },
      app
    );

    this.renderChildItems = debounce(this.renderChildItems.bind(this));
    this.collection = this.options.collection;
  }

  async render() {
    await super.render();

    if (this.options.collection) {
      await this.loadCollection(this.collection);
    } else {
      this.renderChildItems(); // Allow for rendering empty states
    }

    this.setEmptyClass();

    return this;
  }

  protected renderChildItems() {
    if (this.isDestroyed || !this.collection) return;

    if (this.childItems.length) {
      this.destroyChildItems();
    }

    this.collection.getVisibleItems().forEach((model) => {
      if (this.childView) {
        const childView = new this.childView(
          {
            model,
            attachTo: this.el,
            ...this.options.childViewOptions,
          },
          this.app
        );

        childView.render();
        this.children[childView.getViewId()] = childView;
        this.childItems.push(childView);
      }
    });

    this.setEmptyClass();
  }

  async loadCollection(collection?: C): Promise<void> {
    if (!collection) return;

    if (this.collection) {
      this.collection.destroy();
    }

    this.collection = collection as C;

    if (this.collection) {
      await this.collection.isReady.then(() => {
        this.listenToCollection();
      });

      await this.isRendered.then(() => {
        this.renderChildItems();
      });
    }
  }

  destroyChildItems(ids?: string[]) {
    if (ids && ids.length) {
      ids.forEach((id) => {
        this.destroyChildById(id);
      });
    } else {
      this.childItems.forEach((child) => {
        this.destroyChildById(child.getViewId());
      });

      this.childItems = [];
    }
  }

  private listenToCollection() {
    if (!this.collection) return;

    this.collection
      .on("update", {
        handler: () => {
          this.renderChildItems();
          this.emit("change", this.collection);
        },
        listener: this,
      })
      .on("filter", {
        handler: () => {
          this.renderChildItems();
          this.emit("change", this.collection);
        },
        listener: this,
      })
      .on("sort", {
        handler: () => {
          this.renderChildItems();
          this.emit("change", this.collection);
        },
        listener: this,
      });
  }

  private setEmptyClass() {
    this.toggleClass(
      "is-empty",
      !this.collection || this.collection.visibleLength === 0
    );
  }

  destroy() {
    this.destroyChildItems();
    this.collection?.off({ listener: this });

    // @ts-ignore: Inentionally removing properties for clean up, but normally this is not allowed
    delete this.collection;

    return super.destroy();
  }
}
