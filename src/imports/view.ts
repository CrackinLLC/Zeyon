import type Model from "../model";
import type View from "../view";

export interface AttachReference {
  view: View;
  id: string;
}

export interface ViewOptions {
  id?: string;
  classNames?: string[];
  attributes?: Record<string, string | undefined>; // Inline DOM attributes, not to be confused with model attributes
  attachTo?: HTMLElement | NodeListOf<HTMLElement> | AttachReference | string;
  prepend?: boolean;
  customEvents?: string[];
  preventDefault?: boolean; // Capture click events on view el and prevent default behavior

  model?: Model | Partial<{}> | string;
  modelType?: string; // Will attempt to infer model type based on attributes, but for ambiguous cases should explicitly state type here
}

export interface RenderOptions {
  tagName?: string;
}

export interface ErrorStateOptions {
  preventHanding?: boolean; // Prevent the parent from handling the removal of the error state
  attachTo?: HTMLElement;
}

export const errorTemplate = (msg: string): HTMLElement => {
  const errorEl = document.createElement("div");
  errorEl.classList.add("error-message");
  errorEl.innerText = msg;
  return errorEl;
};

export const chipTemplate = (label: string, includeX = false): HTMLElement => {
  const chipEl = document.createElement("div");
  chipEl.classList.add("chip");
  chipEl.innerText = label;

  if (includeX) {
    const X = document.createElement("span");
    X.classList.add("chip-remove");
    X.innerText = "×";
    chipEl.appendChild(X);
  }

  return chipEl;
};

export const loaderTemplate = ({
  type = LoaderType.Slosh,
  wrapped = false,
}: {
  type?: LoaderType;
  wrapped?: boolean;
} = {}): HTMLElement => {
  const loadingStateEl = document.createElement("div");
  loadingStateEl.classList.add("loading-state");
  loadingStateEl.innerHTML = `<span class="${[
    "loader",
    type,
    wrapped ? "loader-wrapped" : "",
  ].join(" ")}" aria-hidden="true">${LoaderMarkup[type]}</span>`;
  return loadingStateEl;
};
