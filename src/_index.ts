import { AttributeDefinition } from './imports/model';

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

interface RegisterEmitterProps {
  // Any global props that apply to all classes...
}

interface RegisterModelProps extends RegisterEmitterProps {
  attributes: Record<string, AttributeDefinition>;
}

interface RegisterCollectionProps extends RegisterEmitterProps {
  modelId: string;
}

interface RegisterViewProps extends RegisterEmitterProps {
  isComponent?: boolean;
  template?: string;
  templateWrapper?: string; // Document the specific use-case here better...
}

interface RegisterRouteViewProps extends RegisterViewProps {}

interface RegisterCollectionViewProps extends RegisterRouteViewProps {
  childViewId: string;
  collectionId: string;
}

function registerClass(registrationId: string, props: {} = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    if ((constructor as any).prototype.hasOwnProperty('constructor')) {
      console.warn(
        `Class ${registrationId} defines its own constructor. This is discouraged. Instead, define an 'initialize' method that is run when instantiating.`,
      );
    }

    // Store the registrationId on the constructor
    (constructor as any).registrationId = registrationId;
    Object.entries(props).forEach(([name, value]) => {
      (constructor as any)[name] = value;
    });

    return constructor;
  };
}

export default {
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

  registerEmitter(registrationId: string, props?: RegisterEmitterProps) {},

  registerModel(registrationId: string, props?: RegisterModelProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      const decoratedClass = registerClass(registrationId)(constructor);

      if (props?.attributes) {
        (decoratedClass as any).definition = {
          ...(decoratedClass as any).definition,
          ...props.attributes,
        };
      }

      return decoratedClass;
    };
  },

  registerCollection(registrationId: string, props?: RegisterCollectionProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      return registerClass(registrationId, props)(constructor);
    };
  },

  registerView(registrationId: string, props?: RegisterViewProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      return registerClass(registrationId, props)(constructor);
    };
  },

  registerRouteView(registrationId: string, props?: RegisterRouteViewProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      return registerClass(registrationId, props)(constructor);
    };
  },

  registerCollectionView(registrationId: string, props?: RegisterCollectionViewProps) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
      return registerClass(registrationId, props)(constructor);
    };
  },

  Emitter,
  Model,
  Collection,
  View,
  RouteView,
  CollectionView,
};
