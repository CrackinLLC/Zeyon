import '../util/polyfill';
import '../util/template';

import HarnessApp from './app';
import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './route';
import Router from './router';
import View from './view';

export { Collection, CollectionView, Emitter, HarnessApp, Model, RouteView, Router, View };

export default {
  create: (options: any) => new HarnessApp(options),
  Collection,
  CollectionView,
  Emitter,
  HarnessApp,
  Model,
  RouteView,
  Router,
  View,
};
