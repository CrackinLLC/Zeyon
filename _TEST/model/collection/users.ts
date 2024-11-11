import Collection from '../../../src/collection';
import UserModel from '../user';

export default class UserCollection extends Collection<UserModel> {
  public static override model = UserModel;

  // Rest of the UserCollection class...
}
