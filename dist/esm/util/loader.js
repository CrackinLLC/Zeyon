export const LoaderMarkup = {
    'slosh-loader': '<div class="inner"></div>',
};
export const loaderTemplate = ({ type = "slosh-loader", wrapped = false, classes = '', } = {}) => {
    const loaderEl = document.createElement('div');
    loaderEl.classList.add('loader', `loader-${type}`);
    if (classes) {
        if (!Array.isArray(classes))
            classes = [classes];
        loaderEl.classList.add(...classes);
    }
    loaderEl.innerHTML = `<span class="${[wrapped ? 'loader-wrapped' : ''].join(' ')}" aria-hidden="true">${LoaderMarkup[type]}</span>`;
    return loaderEl;
};
//# sourceMappingURL=loader.js.map