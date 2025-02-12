import { ClassMapTypeCollection, ClassMapTypeView } from 'zeyon/_maps';
import Collection from './collection';
import type { ZeyonAppLike } from './imports/app';
import { CollectionViewOptions, collectionViewEvents } from './imports/collectionView';
import { debounce } from './util/debounce';
import View from './view';

/**
 * CollectionView manages a collection of models and renders them using a specified model view.
 */
export default abstract class CollectionView extends View {
  declare options: CollectionViewOptions;
  declare defaultOptions: CollectionViewOptions;

  /**
   * The view class used to render each visible model within the collection.
   */
  abstract modelViewRegistrationId: string & keyof ClassMapTypeView;

  /**
   * An array of instantiated model views for each visible model.
   */
  protected modelViews: View[] = [];

  /**
   * The collection being managed by this view.
   */
  protected collection?: Collection;
  protected collectionRegistrationId?: string & keyof ClassMapTypeCollection;

  constructor(options: CollectionViewOptions, app: ZeyonAppLike) {
    super(options, app);

    this.renderContent = debounce(this.renderContent.bind(this), {
      wait: 10,
      shouldAggregate: false,
    });
    this.extendValidEvents(collectionViewEvents);

    if (this.options.collection) {
      this.loadCollection(this.options.collection);
    } else if (this.options.collectionRegistrationId) {
      this.collectionRegistrationId = this.options.collectionRegistrationId;
      this.loadCollection();
    } else {
      throw new Error('Must provide either a collection or a collectionRegistrationId');
    }
  }

  /**
   * Extending getTemplateOptions to pass data about the collection, if any.
   */
  protected getTemplateOptions(): Record<string, unknown> {
    return super.getTemplateOptions({
      ...(this.collection ? { collection: this.collection.getVisibleAttributes() } : {}),
      ...(this.collection ? { collectionType: this.collection.modelRegistrationId } : {}),
    });
  }

  /**
   * Loads a new collection, replacing any existing one.
   * @param collection The new collection to load.
   */
  public async loadCollection(collection?: Collection) {
    if (this.isDestroyed) return;

    if (this.collection) {
      this.collection.off({ subscriber: this });
    }

    if (!collection && this.collectionRegistrationId) {
      collection = await this.app.newCollection(this.collectionRegistrationId, this.options.collectionOptions || {});
    } else if (!this.collectionRegistrationId && collection) {
      this.collectionRegistrationId = collection.modelRegistrationId;
    }

    this.collection = collection!;
    await this.collection!.isReady;

    const eventHander = (type: string) => {
      if (this.hasBeenRendered) this.renderContent();
      this.emit(`collection:${type}`, this.collection);
    };

    this.collection.on('update', () => eventHander('update'), this);
    this.collection.on('filter', () => eventHander('filter'), this);
    this.collection.on('sort', () => eventHander('sort'), this);

    await this.isRendered;
    await this.renderContent(); // When changing collections, we need to re-render our modelViews
  }

  /**
   * Creates a model View for each visible model in the collection, destroying any old modelViews first.
   */
  protected async renderContent(): Promise<void> {
    if (this.isDestroyed) return;

    this.destroyModelViews();

    if (this.collection) {
      await this.collection.isReady;

      const modelViews = await Promise.all(
        this.collection.getVisibleItems().map(async (model) => {
          return this.app.newView(this.modelViewRegistrationId, {
            model,
            attachTo: this.el,
            ...(this.options.modelViewOptions || {}),
          });
        }),
      );

      modelViews.forEach((modelView: View) => {
        modelView.render();
        this.children[modelView.getViewId()] = modelView;
        this.modelViews.push(modelView);
      });
    }

    this.toggleClass('is-empty', !this.collection || this.collection.visibleLength < 1);
  }

  /**
   * Destroys all or specific model views.
   * @param ids Optional array of model view IDs to destroy.
   */
  protected destroyModelViews(ids?: string[]) {
    if (ids && ids.length > 0) {
      ids.forEach((id) => this.destroyChildById(id));
      this.modelViews = this.modelViews.filter((v) => !ids.includes(v.getViewId()));
    } else {
      this.modelViews.forEach((v) => this.destroyChildById(v.getViewId()));
      this.modelViews = [];
    }
  }

  /**
   * Destroys the collection view, removing event listeners and model views.
   */
  public destroy(silent: boolean = false): void {
    if (this.isDestroyed) return;
    super.destroy(silent);

    this.destroyModelViews();

    if (this.collection) {
      this.collection.off({ subscriber: this });
    }
    delete this.collection;
  }
}
