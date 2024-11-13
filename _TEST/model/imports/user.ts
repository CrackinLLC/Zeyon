import { AttributeDefinition, AttributeType, Attributes } from '../../../src/imports/model';

export enum UserType {
  Pending = 'pending',
  Owner = 'owner',
  Tenant = 'tenant',
  Vendor = 'vendor',
}

export enum UserStatus {
  Active = 'active',
  Pending = 'pending',
  Disabled = 'disabled',
  Suspended = 'suspended',
}

export enum UserTeamPosition {
  Owner = 'owner',
  Admin = 'admin',
  Senior = 'senior',
  Standard = 'standard',
  Guest = 'guest',
}

export enum UserTeamRole {
  PropertyOwner = 'property-owner',
  PropertyManager = 'property-manager',
  Vendor = 'vendor',
  Inspector = 'inspector',
  Advisor = 'advisor',
  Marketing = 'marketing',
}

export enum UserTimezone {
  EST = 'est',
  CST = 'cst',
  MST = 'mst',
  PST = 'pst',
}

export interface UserAttributes extends Attributes {
  team_ids?: number[];
  todo_ids?: number[];
  email?: string;
  type?: UserType;
  first_name?: string;
  last_name?: string;
  status?: UserStatus;
  position?: UserTeamPosition;
  roles?: UserTeamRole[];
  timezone?: UserTimezone;
  profile_img?: string;
}

export const userDefinition: { [key in keyof UserAttributes]: AttributeDefinition } = {
  id: {
    type: AttributeType.Number,
  },
  team_ids: {
    default: [],
    type: AttributeType.NumberArray,
  },
  todo_ids: {
    default: [],
    type: AttributeType.NumberArray,
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
    type: AttributeType.StringArray,
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
