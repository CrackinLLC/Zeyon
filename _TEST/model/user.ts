import { ModelType } from '../../src/imports/model';
import Model from '../../src/model';
import { UserAttributes, userDefinition } from './imports/user';

export default class UserModel<A extends UserAttributes = UserAttributes> extends Model<A> {
  public static override type = ModelType.Unknown; // TODO: Extend ModelType to include "User" (and others)
  public static override definition = userDefinition;

  protected async initialize(): Promise<void> {
    console.log('User model is initializing...');
  }

  protected validateAttributes(attributes: Partial<A>): Partial<A> {
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
}
