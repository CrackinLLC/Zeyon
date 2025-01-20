import '../util/polyfill';
import '../util/template';

import ZeyonApp from './app';
import type { ZeyonAppOptions } from './imports/app';
import { AttributeDefinition } from './imports/model';
import type { RouteConfig } from './imports/router';
import Router from './router';

import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';

// interface RegisterViewOptions {
//   options?: any; // An options interface defined by the developer, to use for type safety when instantiating an instance

//   template?: string;
//   templateWrapper?: string; // Document the specific use-case here better...
// }

// interface RegisterRouteViewOptions extends RegisterViewOptions {}

interface RegisterModelOptions {
  attributes: Record<string, AttributeDefinition>;
}

// interface RegisterCollectionOptions {
//   modelId: string;
// }

// interface RegisterCollectionViewOptions {
//   childViewId: string;
//   collectionId: string;
// }

function registerClass(registrationId: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    if ((constructor as any).prototype.hasOwnProperty('constructor')) {
      console.warn(
        `Class ${registrationId} defines its own constructor. This is discouraged. Instead, define an 'initialize' method that is run when instantiating.`,
      );
    }

    // Store the registrationId on the constructor
    (constructor as any).registrationId = registrationId;
    return constructor;
  };
}

export type { CollectionOptions } from './imports/collection';
export type { CollectionViewOptions } from './imports/collectionView';
export type { EmitterOptions } from './imports/emitter';
export type { ModelOptions } from './imports/model';
export type { RouteViewOptions } from './imports/routeView';
export type { ViewOptions } from './imports/view';
export { Collection, CollectionView, Emitter, Model, RouteConfig, Router, RouteView, View, ZeyonApp, ZeyonAppOptions };

export default {
  create: (options: any) => new ZeyonApp(options),

  /**
   * Usage:
   
    import Zeyon from 'zeyon';

    @Zeyon.registerClass('my-class', {// options })
    export class MyClass extends Zeyon.BaseClass {
      initialize(options: any) {
        // Do stuff...
      }
    }
  */

  registerView(registrationId: string) {
    //, options?: RegisterViewOptions) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      const decoratedClass = registerClass(registrationId)(constructor);

      // TODO: Implement options handling

      return decoratedClass;
    };
  },

  registerRouteView(registrationId: string) {
    //, options?: RegisterRouteViewOptions) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      const decoratedClass = registerClass(registrationId)(constructor);

      // TODO: Implement options handling

      return decoratedClass;
    };
  },

  registerModel(registrationId: string, options?: RegisterModelOptions) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      const decoratedClass = registerClass(registrationId)(constructor);

      if (options?.attributes) {
        (decoratedClass as any).definition = {
          ...(decoratedClass as any).definition,
          ...options.attributes,
        };
      }

      return decoratedClass;
    };
  },

  registerCollection(registrationId: string) {
    //, options?: RegisterCollectionOptions) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      const decoratedClass = registerClass(registrationId)(constructor);

      // TODO: Implement options handling

      return decoratedClass;
    };
  },

  registerCollectionView(registrationId: string) {
    //, options?: RegisterCollectionViewOptions) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      const decoratedClass = registerClass(registrationId)(constructor);

      // TODO: Implement options handling

      return decoratedClass;
    };
  },

  /**
   * Used to ensure custom route properties conform to the interface supplied by the developer
   * @param routes
   * @returns
   */
  defineRoutes<CustomRouteProps extends {} = {}>(
    routes: RouteConfig<CustomRouteProps>[],
  ): RouteConfig<CustomRouteProps>[] {
    return routes;
  },

  Collection,
  CollectionView,
  Emitter,
  Model,
  RouteView,
  Router,
  View,
};
