export interface ErrorStateOptions {
  attachTo?: HTMLElement;
  preventHanding?: boolean; // Prevent the parent class from automatically removing the error state on input.
}

export const errorTemplate = (msg: string): HTMLElement => {
  const errorEl = document.createElement('div');
  errorEl.classList.add('error-message');
  errorEl.innerText = msg;
  return errorEl;
};
