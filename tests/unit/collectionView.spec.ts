import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CollectionViewOptions } from 'zeyon/imports';
import { getPrivate, milliseconds } from '../util/driver';
import { TestZeyonApp } from '../util/testApp';
import { TestCollection } from '../util/testCollection';
import { TestCollectionView } from '../util/TestCollectionView';
import { TestModel } from '../util/testModel';

describe('CollectionView', () => {
  let app: TestZeyonApp;
  let collection: TestCollection;
  let collectionView: TestCollectionView;

  const getVisibleLength = () => {
    if (collectionView) {
      return getPrivate(collectionView, 'modelViews').length;
    }
  };

  beforeEach(async () => {
    app = new TestZeyonApp();
    collection = new TestCollection({}, app) as any;
    collection.modelConstructor = TestModel;
    await collection.isReady;
  });

  it('throws if no collection or collectionRegistrationId is provided', () => {
    expect(() => {
      new TestCollectionView({} as CollectionViewOptions, app);
    }).toThrowError(/Must provide either a collection/);
  });

  it('accepts a direct collection in options', async () => {
    await collection.newModel({ id: 1 });
    collectionView = new TestCollectionView({ collection }, app);

    await collectionView.render();
    await milliseconds(20);

    expect(getPrivate(collectionView, 'collection').length).toBe(1);
    expect(getVisibleLength()).toBe(1);
  });

  it('creates the collection if only collectionRegistrationId is provided', async () => {
    const collectionId = 'my-collection';
    const newCollSpy = vi.spyOn(app, 'newCollection').mockResolvedValue(new TestCollection({}, app) as any);

    collectionView = new TestCollectionView({ collectionRegistrationId: collectionId }, app);
    await collectionView.render();

    expect(newCollSpy).toHaveBeenCalledWith(collectionId, {});
  });

  it('listens to collection events and re-renders subviews', async () => {
    await collection.newModel({ id: 10 });
    collectionView = new TestCollectionView({ collection }, app);

    await collectionView.render();
    await milliseconds(20);

    expect(getVisibleLength()).toBe(1);

    await collection.newModel({ id: 11 });
    await milliseconds(20);

    expect(getVisibleLength()).toBe(2);
  });

  it('emits "collection:update" etc. on collection changes', async () => {
    const collUpdateSpy = vi.fn();
    collectionView = new TestCollectionView({ collection }, app);
    collectionView.on('collection:update', collUpdateSpy);

    await collectionView.render();

    collection.emit('update', {});
    await milliseconds(20); // Wait a short time for the debounced re-render

    expect(collUpdateSpy).toHaveBeenCalledTimes(1);
    expect(collUpdateSpy.mock.calls[0][0].emitter).toBe(collectionView);
    expect(collUpdateSpy.mock.calls[0][0].data).toBe(collection);
  });

  it('destroy() cleans up modelViews and unsubscribes from collection', async () => {
    const offSpy = vi.spyOn(TestCollection.prototype, 'off');
    collection.newModel({ id: 100 });
    collectionView = new TestCollectionView({ collection }, app);

    await collectionView.render();
    await milliseconds(20);

    expect(Object.keys(collectionView['children']).length).toBe(1);

    collectionView.destroy();

    expect(collectionView['isDestroyed']).toBe(true);
    expect(getVisibleLength()).toBe(0);
    expect(offSpy).toHaveBeenCalledWith({ subscriber: collectionView });
  });
});
