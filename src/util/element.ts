import type View from '../view';

export interface RootElement extends HTMLElement {
  view: View;
  destroy: () => void;
}

export function elIsRootEl(el: Element): el is RootElement {
  return el instanceof HTMLElement && Object.keys(el).includes('view');
}

export function convertToRootElement(el: HTMLElement, context: View): RootElement {
  const newEl: RootElement = el as RootElement;
  newEl.view = context;

  newEl.destroy = function destroy() {
    // @ts-ignore: Inentionally removing properties for clean up, but normally this is not allowed
    delete newEl.view;

    newEl.innerHTML = '';
    newEl.remove();
  };

  return newEl;
}
