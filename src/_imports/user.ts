import { AttributeDefinition, AttributeType } from "../util/types";
import type { ModelOptions } from "./model";

export interface UserModelOptions<A extends UserAttributes = UserAttributes>
  extends ModelOptions<A> {
  attributeDefinition?: UserAttributes;
}

export const enum UserType {
  Pending = "pending",
  Owner = "owner",
  Tenant = "tenant",
  Vendor = "vendor",
}

export const enum UserStatus {
  Active = "active",
  Pending = "pending",
  Disabled = "disabled",
  Suspended = "suspended",
}

export const enum UserTeamPosition {
  Owner = "owner",
  Admin = "admin",
  Senior = "senior",
  Standard = "standard",
  Guest = "guest",
}

export const enum UserTeamRole {
  PropertyOwner = "property-owner",
  PropertyManager = "property-manager",
  Vendor = "vendor",
  Inspector = "inspector",
  Advisor = "advisor",
  Marketing = "marketing",
}

export const enum UserTimezone {
  EST = "est",
  CST = "cst",
  MST = "mst",
  PST = "pst",
}

export interface UserAttributes extends Record<string, any> {
  id: number | AttributeDefinition;
  team_ids?: number[] | AttributeDefinition;
  todo_ids?: number[] | AttributeDefinition;
  email?: string | AttributeDefinition;
  type?: UserType | AttributeDefinition;
  first_name?: string | AttributeDefinition;
  last_name?: string | AttributeDefinition;
  status?: UserStatus | AttributeDefinition;
  position?: UserTeamPosition | AttributeDefinition;
  roles?: UserTeamRole[] | AttributeDefinition;
  timezone?: UserTimezone | AttributeDefinition;
  profile_img?: string | AttributeDefinition;
}

export const userAttributes: UserAttributes = {
  id: {
    type: AttributeType.Number,
  },
  team_ids: {
    default: [], // List of team IDs the user is associated with
    type: AttributeType.ArrayNumber,
  },
  todo_ids: {
    default: [], // List of todo IDs assigned to this user
    type: AttributeType.ArrayNumber,
  },
  email: {
    type: AttributeType.String,
    optional: true,
  },
  type: {
    default: UserType.Pending,
    type: AttributeType.String,
  },
  first_name: {
    type: AttributeType.String,
    optional: true,
  },
  last_name: {
    type: AttributeType.String,
    optional: true,
  },
  status: {
    default: UserStatus.Active,
    type: AttributeType.String,
  },
  position: {
    default: UserTeamPosition.Standard,
    type: AttributeType.String,
  },
  roles: {
    default: [],
    type: AttributeType.ArrayString,
  },
  timezone: {
    default: UserTimezone.MST,
    type: AttributeType.String,
  },
  profile_img: {
    type: AttributeType.String,
    optional: true,
  },
};
