import type ZeyonApp from './app';
import type { CollectionLike } from './imports/collection';
import type { CollectionViewOptions } from './imports/collectionView';
import { debounce } from './util/debounce';
import View from './view';

/**
 * CollectionView manages a collection of models and renders them using a specified child view.
 * @template C The type of the collection.
 * @template V The type of the child view.
 */
export default class CollectionView<C extends CollectionLike = CollectionLike, CV extends View = View> extends View {
  declare options: CollectionViewOptions<C, CV>;

  /**
   * The collection being managed by this view.
   */
  protected collection?: C;

  /**
   * The view class used to render each child item.
   */
  protected childView?: new (options: any, app: ZeyonApp) => CV;

  /**
   * An array of instantiated child views.
   */
  protected childItems: CV[] = [];

  constructor(options: CollectionViewOptions<C, CV>, app: ZeyonApp) {
    super(options, app);

    this.extendValidEvents(['change']);
    this.renderChildItems = debounce(this.renderChildItems.bind(this));
    this.collection = options.collection;
    this.childView = options.childView;
  }

  /**
   * Renders the collection view and loads the collection if provided.
   */
  async render() {
    await super.render();

    try {
      if (this.collection) {
        await this.loadCollection(this.collection);
      } else {
        this.renderChildItems();
      }
    } catch (error) {
      console.error('Error rendering collection view:', error);
    }

    this.setEmptyClass();

    return this;
  }

  /**
   * Provides template options, including the collection's visible attributes and type.
   */
  protected getTemplateOptions(): Record<string, unknown> {
    return super.getTemplateOptions({
      ...(this.collection ? { collection: this.collection.getVisibleAttributes() } : {}),
      ...(this.collection ? { collectionType: this.collection.getType() } : {}),
    });
  }

  /**
   * Renders each item in the collection using the specified child view.
   */
  protected renderChildItems() {
    if (this.isDestroyed || !this.collection) return;

    this.destroyChildItems();

    this.collection.getVisibleItems().forEach((model) => {
      if (this.childView) {
        const childView = new this.childView(
          {
            model,
            attachTo: this.el,
            ...this.options.childViewOptions,
          },
          this.app,
        );

        childView.render();
        this.children[childView.getViewId()] = childView;
        this.childItems.push(childView);
      }
    });

    this.setEmptyClass();
  }

  /**
   * Loads a new collection, replacing any existing one.
   * @param collection The new collection to load.
   */
  async loadCollection(collection?: C): Promise<void> {
    if (this.collection) {
      this.collection.off({ subscriber: this });
    }

    this.collection = collection;

    if (this.collection) {
      await this.collection.isReady;
      this.listenToCollection();
      await this.isRendered;
      this.renderChildItems();
    }
  }

  /**
   * Destroys all or specific child views.
   * @param ids Optional array of child view IDs to destroy.
   */
  protected destroyChildItems(ids?: string[]) {
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

  /**
   * Sets up event listeners on the collection to respond to updates.
   */
  protected listenToCollection() {
    if (!this.collection) return;

    this.collection.on('update', () => {
      this.renderChildItems();
      this.emit('change', this.collection), this;
    });

    this.collection.on('filter', () => {
      this.renderChildItems();
      this.emit('change', this.collection), this;
    });

    this.collection.on('sort', () => {
      this.renderChildItems();
      this.emit('change', this.collection), this;
    });
  }

  /**
   * Toggles an 'is-empty' class based on whether the collection has visible items.
   */
  protected setEmptyClass() {
    this.toggleClass('is-empty', !this.collection || this.collection.visibleLength === 0);
  }

  /**
   * Destroys the collection view, removing event listeners and child views.
   */
  destroy() {
    this.destroyChildItems();
    if (this.collection) {
      this.collection.off({ subscriber: this });
    }
    delete this.collection;

    return super.destroy();
  }
}
