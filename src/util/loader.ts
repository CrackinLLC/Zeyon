export const enum LoaderType {
  Slosh = 'slosh-loader',
}

export const LoaderMarkup = {
  'slosh-loader': '<div class="inner"></div>',
};

export const loaderTemplate = ({
  type = LoaderType.Slosh,
  wrapped = false, // Special class specifically used to include a surrounding visual element to better differentiate loader from background
  classes = '',
}: {
  type?: LoaderType;
  wrapped?: boolean;
  classes?: string | string[];
} = {}): HTMLElement => {
  const loaderEl = document.createElement('div');

  loaderEl.classList.add('loader', `loader-${type}`);

  if (classes) {
    if (!Array.isArray(classes)) classes = [classes];
    loaderEl.classList.add(...classes);
  }

  loaderEl.innerHTML = `<span class="${[wrapped ? 'loader-wrapped' : ''].join(' ')}" aria-hidden="true">${
    LoaderMarkup[type]
  }</span>`;

  return loaderEl;
};
