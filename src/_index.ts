import '../util/polyfill';
import '../util/template';

import ZeyonApp from './app';
import Router from './router';
export type { ZeyonAppOptions } from './imports/app';
export type { RouteConfig } from './imports/router';

import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';

export type { CollectionOptions } from './imports/collection';
export type { CollectionViewOptions } from './imports/collectionView';
export type { EmitterOptions } from './imports/emitter';
export type { ModelOptions } from './imports/model';
export type { RouteViewOptions } from './imports/routeView';
export type { ViewOptions } from './imports/view';

export { Collection, CollectionView, Emitter, Model, RouteView, Router, View, ZeyonApp };
export default {
  // Instantiate a Zeyon application instance
  create: (options: any) => new ZeyonApp(options),

  // Applied as a decorator, used to facilitate registering developer-created class definitions with the application registry
  registerClass(registrationId: string, meta: Record<string, any> = {}) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      if ((constructor as any).prototype.hasOwnProperty('constructor')) {
        console.warn(
          `Class ${registrationId} defines its own constructor. This is discouraged. Include an 'initialize' method instead.`,
        );
      }

      // Store the registrationId and meta on the constructor
      (constructor as any).registrationId = registrationId;
      (constructor as any).registrationMeta = meta;
      return constructor;
    };
  },

  /**
   * Usage:
   
    import Zeyon from 'zeyon';

    @Zeyon.registerClass('header-view', { version: '1.0.0' })
    export class HeaderView extends Emitter {
      initialize(options: any) {
        // Do stuff...
      }
    }

   */

  Collection,
  CollectionView,
  Emitter,
  Model,
  RouteView,
  Router,
  View,
};
