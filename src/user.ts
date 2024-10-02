import { ModelType } from "../_imports/model";
import {
  UserAttributes,
  userAttributes,
  UserModelOptions,
} from "../_imports/user";
import BaseModel from "./_baseModel";
import type ApplicationCore from "./app";
import type TodosCollection from "./collection/todos";

export default class UserModel<
  A extends UserAttributes = UserAttributes
> extends BaseModel<A> {
  static type = ModelType.User;

  declare options: UserModelOptions<A>;

  private todoCollection: TodosCollection | null = null;

  constructor(options: UserModelOptions<A>, app: ApplicationCore) {
    const { attributeDefinition, ...remainingOptions } = options;
    super(remainingOptions, (attributeDefinition || userAttributes) as A, app);
  }

  async getTodos(force: boolean = false): Promise<TodosCollection | null> {
    const fetchedCollection = await this.fetchCollectionByIds<TodosCollection>({
      collectionProperty: this.todoCollection,
      collectionName: "collection-todos",
      idAttribute: "todo_ids",
      force,
    });

    if (fetchedCollection) {
      this.todoCollection = fetchedCollection;
    }

    return this.todoCollection;
  }
}
