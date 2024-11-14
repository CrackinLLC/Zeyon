import '../util/polyfill';
import '../util/template';

import ZeyonApp from './app';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './route';
import Router from './router';
import View from './view';

export type { CollectionOptions } from './imports/collection';
export type { ModelOptions } from './imports/model';
export type { RouteConfig } from './imports/router';

export { Collection, CollectionView, Emitter, Model, RouteView, Router, View, ZeyonApp };
export default {
  create: (options: any) => new ZeyonApp(options),
  Collection,
  CollectionView,
  Emitter,
  ZeyonApp,
  Model,
  RouteView,
  Router,
  View,
};
