import type { ClassMapTypeCollection, ClassMapTypeModel, ClassMapTypeView } from 'zeyon/_maps';
import { AttributeDefinition } from './imports/model';

import Collection from './collection';
import CollectionView from './collectionView';
import Emitter from './emitter';
import Model from './model';
import RouteView from './routeView';
import View from './view';

import { CollectionOptions } from './imports/collection';
import { CollectionViewOptions } from './imports/collectionView';
import { EmitterOptions } from './imports/emitter';
import { Attributes, ModelOptions } from './imports/model';
import { RouteViewOptions } from './imports/routeView';
import { ViewOptions } from './imports/view';

import * as loader from './util/loader';
import * as object from './util/object';
import * as string from './util/string';

interface RegisterEmitterProps {
  // Any global props that apply to all classes?
}

interface RegisterModelProps extends RegisterEmitterProps {
  attributes: Record<string, AttributeDefinition>;
}

interface RegisterCollectionProps extends RegisterEmitterProps {
  modelRegistrationId: string & keyof ClassMapTypeModel;
}

interface RegisterViewProps extends RegisterEmitterProps {
  tagName?: string;
  isComponent?: boolean; // Default: false
  template?: string;
  templateWrapper?: string;
  ui?: { [key: string]: string };
  styles?: string;
}

interface RegisterRouteViewProps extends RegisterViewProps {}

interface RegisterCollectionViewProps extends RegisterRouteViewProps {
  modelViewRegistrationId: string & keyof ClassMapTypeView;
  collectionRegistrationId: string & keyof ClassMapTypeCollection;
}

export default {
  /**
   * Usage:
   
    import Zeyon from 'zeyon';

    @Zeyon.registerClass('my-class', {// props })
    export class MyClass extends Zeyon.BaseClass {
      initialize() {
        // Do stuff...
      }
    }
  */

  registerEmitter<O extends EmitterOptions = EmitterOptions>(registrationId: string, props?: RegisterEmitterProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      console.log('Emitter decorated with:', registrationId, props);
      return constructor;
    };
  },

  registerModel<O extends ModelOptions<Attributes> = ModelOptions<Attributes>>(
    registrationId: string,
    props?: RegisterModelProps,
  ) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      console.log('Model decorated with:', registrationId, props);
      return constructor;
    };
  },

  registerCollection<O extends CollectionOptions = CollectionOptions>(
    registrationId: string,
    props?: RegisterCollectionProps,
  ) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      console.log('Collection decorated with:', registrationId, props);
      return constructor;
    };
  },

  registerView<O extends ViewOptions = ViewOptions>(registrationId: string, props?: RegisterViewProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      console.log('View decorated with:', registrationId, props);
      return constructor;
    };
  },

  registerRouteView<O extends RouteViewOptions = RouteViewOptions>(
    registrationId: string,
    props?: RegisterRouteViewProps,
  ) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      console.log('RouteView decorated with:', registrationId, props);
      return constructor;
    };
  },

  registerCollectionView<O extends CollectionViewOptions = CollectionViewOptions>(
    registrationId: string,
    props?: RegisterCollectionViewProps,
  ) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      console.log('CollectionView decorated with:', registrationId, props);
      return constructor;
    };
  },

  // Class definition references
  Emitter,
  Model,
  Collection,
  View,
  RouteView,
  CollectionView,

  // Utility function references
  string,
  loader,
  object,
};

export type { CollectionOptions, CollectionViewOptions, EmitterOptions, ModelOptions, RouteViewOptions, ViewOptions };

export type {
  AnyEventHandler,
  ClassConfigurationOptions,
  EventHandlerApply,
  NativeEventHandler,
  NormalEventHandler,
  WildcardEventHandler,
} from './imports/emitter';
