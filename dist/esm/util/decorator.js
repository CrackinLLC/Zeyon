export function RegisterClass(registrationId, meta = {}) {
    return function (constructor) {
        constructor.registrationId = registrationId;
        constructor.registrationMeta = meta;
        return constructor;
    };
}
//# sourceMappingURL=decorator.js.map