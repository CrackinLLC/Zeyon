import type HarnessApp from '../../src/app';
import { ModelType } from '../../src/imports/model';
import Model from '../../src/model';
import { UserAttributes, userAttributes, UserModelOptions } from './imports/user';

export default class UserModel extends Model<UserAttributes> {
  public static type = ModelType.Unknown;
  public static idKey = 'id';

  constructor(options: UserModelOptions, app: HarnessApp) {
    super(
      {
        ...options,
        definitions: userAttributes,
      },
      app,
    );
  }

  // Optionally override validateAttributes for additional validation
  protected validateAttributes(attributes: Partial<UserAttributes>): Partial<UserAttributes> {
    const validated = super.validateAttributes(attributes);

    // Custom validation logic, if necessary
    // For example, ensure email is valid
    if ('email' in validated && typeof validated.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(validated.email)) {
        console.warn(`Invalid email format: ${validated.email}`);
      }
    }

    return validated;
  }

  // ... rest of the UserModel methods ...
}
