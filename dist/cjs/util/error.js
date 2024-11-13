"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorTemplate = void 0;
const errorTemplate = (msg) => {
    const errorEl = document.createElement('div');
    errorEl.classList.add('error-message');
    errorEl.innerText = msg;
    return errorEl;
};
exports.errorTemplate = errorTemplate;
//# sourceMappingURL=error.js.map