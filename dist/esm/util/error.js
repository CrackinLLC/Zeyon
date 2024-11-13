export const errorTemplate = (msg) => {
    const errorEl = document.createElement('div');
    errorEl.classList.add('error-message');
    errorEl.innerText = msg;
    return errorEl;
};
//# sourceMappingURL=error.js.map