import type BaseView from '../view/_baseView.ts';

export interface RootElement extends HTMLElement {
  view: BaseView;
  removeClassByPrefix: (prefex: string) => RootElement;
  destroy: () => void;
}

export function elIsRootEl(el: Element): el is RootElement {
  return el instanceof HTMLElement && Object.keys(el).includes('view');
}

export function convertToRootElement(el: HTMLElement, context: BaseView): RootElement {
  const newEl = el as RootElement;
  newEl.view = context;

  newEl.removeClassByPrefix = function removeClassByPrefix(prefix: string): RootElement {
    if (this.el) {
      this.el.classList.forEach((value: string) => {
        if (value.startsWith(prefix)) {
          this.el.classList.remove(value);
        }
      });
    }

    return this.el;
  }.bind(context);

  newEl.destroy = function destroy() {
    // @ts-ignore: Inentionally removing properties for clean up, but normally this is not allowed
    delete newEl.view;
    // @ts-ignore
    delete newEl.removeClassByPrefix;

    newEl.innerHTML = '';
    newEl.remove();
  };

  return newEl;
}
