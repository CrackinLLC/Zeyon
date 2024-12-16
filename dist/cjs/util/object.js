"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEqual = isEqual;
exports.getDeepCopy = getDeepCopy;
function isEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
        return compareArrays(a, b);
    }
    if (typeof a === 'object' && typeof b === 'object') {
        return compareObjects(a, b);
    }
    return false;
}
function compareArrays(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i]))
            return false;
    }
    return true;
}
function compareObjects(a, b) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key))
            return false;
        if (!isEqual(a[key], b[key]))
            return false;
    }
    return true;
}
function getDeepCopy(value) {
    if (value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => getDeepCopy(item));
    }
    if (typeof value === 'object') {
        const clone = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                clone[key] = getDeepCopy(value[key]);
            }
        }
        return clone;
    }
    return value;
}
//# sourceMappingURL=object.js.map