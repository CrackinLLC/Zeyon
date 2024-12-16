"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elIsRootEl = elIsRootEl;
exports.convertToRootElement = convertToRootElement;
function elIsRootEl(el) {
    return el instanceof HTMLElement && Object.keys(el).includes('view');
}
function convertToRootElement(el, context) {
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