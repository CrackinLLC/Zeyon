import Collection from '../../../src/collection';
import { UserAttributes } from '../imports/user';
import UserModel from '../user';

export default class UserCollection extends Collection<UserAttributes, UserModel> {
  protected getModelClass(): typeof UserModel {
    return UserModel;
  }

  public async initialize(): Promise<void> {
    console.log('User collection is initializing...');
  }

  doThing() {
    console.log('test');
  }
}
