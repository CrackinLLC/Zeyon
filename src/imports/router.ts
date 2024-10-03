export interface SectionConfig {
  id: string; // Unique identifier for the section. All lowercase and does not contain spaces.
  name: string; // Human-friendly display string for section
  defaultUrl?: string; // Default URL to navigate to when section is selected but no screen is specified
  showHeader?: boolean;
  hidden?: boolean; // Section is supported but is not exposed as an available section
}

export interface ScreenConfig {
  id: string; // Unique identifier for the screen. All lowercase and does not contain spaces.
  viewBinaryId: string; // Binary identifier for the view class
  name: string; // Human-friendly display string for screen
  shortName?: string; // Abbreviated display string for screen
  url: string;
  hidden?: boolean; // Screen is supported but is not exposed as an available section
}

type Section = {
  config: SectionConfig;
  screens: ScreenConfig[];
};

export type ScreenMap = Record<string, Section>;

export interface UrlMapEntry {
  viewBinaryId: string;
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
