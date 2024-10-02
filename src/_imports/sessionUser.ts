import { AttributeDefinition, AttributeType } from "../../util/types";
import type { BaseModelOptions } from "./model";
import { UserAttributes, userAttributes } from "./user";

export interface SessionUserModelOptions
  extends BaseModelOptions<SessionUserAttributes> {
  // Add custom options here
}

export const enum SessionUserTheme {
  Light = "light",
  Dark = "dark",
}

export const enum SessionUserLanguage {
  English = "en",
}

export interface SessionUserAttributes extends UserAttributes {
  active_team_id?: number | AttributeDefinition;
  setting_2fa?: boolean | AttributeDefinition;
  setting_lang?: SessionUserLanguage | AttributeDefinition;
  setting_theme?: SessionUserTheme | AttributeDefinition;
}

export const sessionUserAttributes: SessionUserAttributes = {
  ...userAttributes,
  id: {
    default: -1, // -1 signifies a logged out session user
    type: AttributeType.Number,
  },
  active_team_id: {
    default: -1, // -1 signifies no active team
    type: AttributeType.Number,
  },
  setting_2fa: {
    default: false,
    type: AttributeType.Boolean,
  },
  setting_lang: {
    default: SessionUserLanguage.English,
    type: AttributeType.String,
  },
  setting_theme: {
    default: SessionUserTheme.Light,
    type: AttributeType.String,
  },
};
