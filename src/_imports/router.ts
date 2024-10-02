import type { IconType } from '../util/icons';
import type BaseView from '../view/_baseView';

export interface SectionConfig {
  id: string; // Unique identifier for the section. All lowercase and does not contain spaces.
  name: string; // Human-friendly display string for section
  shortName?: string; // Abbreviated display string for section
  icon: IconType;
  defaultUrl?: string; // Default URL to navigate to when section is selected but no screen is specified
  showHeader?: boolean;
  hidden?: boolean; // Prevents section from showing up rendered navigation lists or menus
}

export interface ScreenConfig {
  id: string; // Unique identifier for the screen. All lowercase and does not contain spaces.
  name: string; // Human-friendly display string for screen
  shortName?: string; // Abbreviated display string for screen
  url: string;
  view: typeof BaseView;
  hidden?: boolean; // Prevents screen from showing up rendered navigation lists or menus
}

type Section = {
  config: SectionConfig;
  screens: ScreenConfig[];
};

export type ScreenMap = Record<string, Section>;

export interface UrlMapEntry {
  view: typeof BaseView;
  sectionId: string;
  screenId: string;
}

export type UrlMap = Record<string, UrlMapEntry>;

export interface NavigateEventPayload {
  sectionConfig?: SectionConfig;
  screenConfig: ScreenConfig;
}

export interface RouterOptions {
  screenMap: ScreenMap;
  window: Window;
  baseUrl?: string;
  defaultUrl?: string;
}
