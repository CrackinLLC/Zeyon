export function elIsRootEl(el) {
    return el instanceof HTMLElement && Object.keys(el).includes('view');
}
export function convertToRootElement(el, context) {
    const newEl = el;
    newEl.view = context;
    newEl.destroy = function destroy() {
        delete newEl.view;
        newEl.innerHTML = '';
        newEl.remove();
    };
    return newEl;
}
//# sourceMappingURL=element.js.map