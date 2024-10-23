export const enum LoaderType {
  Slosh = 'slosh-loader',
}

export const loaderTemplate = ({
  type = LoaderType.Slosh,
  wrapped = false,
}: {
  type?: LoaderType;
  wrapped?: boolean;
} = {}): HTMLElement => {
  const LoaderMarkup = {
    'slosh-loader': '<div class="inner"></div>',
  };

  const loadingStateEl = document.createElement('div');
  loadingStateEl.classList.add('loading-state');
  loadingStateEl.innerHTML = `<span class="${['loader', type, wrapped ? 'loader-wrapped' : ''].join(
    ' ',
  )}" aria-hidden="true">${LoaderMarkup[type]}</span>`;

  return loadingStateEl;
};
