"use strict";
if (!Promise.withResolvers) {
    Promise.withResolvers = function () {
        if (!this)
            throw new TypeError("Promise.withResolvers called on non-object");
        const out = {};
        out.promise = new this((resolve, reject) => {
            out.resolve = resolve;
            out.reject = reject;
        });
        return out;
    };
}
//# sourceMappingURL=polyfill.js.map