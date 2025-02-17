import Zeyon from 'zeyon';

export class DummyClassView extends Zeyon.View {
  static registrationId = 'dummy-view';
}
export class DummyClassModel extends Zeyon.Model {
  static registrationId = 'dummy-model';
  attrib: {};
}
export class DummyClassCollection extends Zeyon.Collection {
  static registrationId = 'dummy-collection';
  modelRegistrationId = 'dummy-model';
}
export class InvalidClass {}

export const classMapData = {
  'dummy-view': {
    classRef: DummyClassView,
    type: 'View',
  },
  'dummy-model': {
    classRef: DummyClassModel,
    type: 'Model',
  },
  'dummy-collection': {
    classRef: DummyClassCollection,
    type: 'Collection',
  },
};
