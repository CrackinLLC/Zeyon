import Model from '../../src/model';

export class TestModel extends Model {
  static registrationId = 'test-model';

  declare attrib: {
    id?: number;
    name?: string;
  };

  static definition = {
    id: { type: 'number', optional: true },
    name: { type: 'string', optional: true },
  } as const;
}
