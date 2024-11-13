"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToRootElement = exports.elIsRootEl = void 0;
function elIsRootEl(el) {
    return el instanceof HTMLElement && Object.keys(el).includes('view');
}
exports.elIsRootEl = elIsRootEl;
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
exports.convertToRootElement = convertToRootElement;
//# sourceMappingURL=element.js.map