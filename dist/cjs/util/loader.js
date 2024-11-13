"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loaderTemplate = exports.LoaderMarkup = void 0;
exports.LoaderMarkup = {
    'slosh-loader': '<div class="inner"></div>',
};
const loaderTemplate = ({ type = "slosh-loader", wrapped = false, classes = '', } = {}) => {
    const loaderEl = document.createElement('div');
    loaderEl.classList.add('loader', `loader-${type}`);
    if (classes) {
        if (!Array.isArray(classes))
            classes = [classes];
        loaderEl.classList.add(...classes);
    }
    loaderEl.innerHTML = `<span class="${[wrapped ? 'loader-wrapped' : ''].join(' ')}" aria-hidden="true">${exports.LoaderMarkup[type]}</span>`;
    return loaderEl;
};
exports.loaderTemplate = loaderTemplate;
//# sourceMappingURL=loader.js.map