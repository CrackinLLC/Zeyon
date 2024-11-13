export function debounce(func, { wait = 50, shouldAggregate = true, } = {}) {
    let timeout;
    let argsAccumulator = shouldAggregate ? undefined : {};
    let primitiveAccumulator = [];
    return function (...args) {
        if (!shouldAggregate) {
            argsAccumulator = args[args.length - 1];
        }
        else {
            if (argsAccumulator === undefined) {
                argsAccumulator = [];
            }
            args.forEach((arg) => {
                if (arg !== undefined && arg !== null) {
                    if (Array.isArray(arg)) {
                        argsAccumulator = [...argsAccumulator, ...arg];
                    }
                    else if (typeof arg === "object") {
                        argsAccumulator.push(arg);
                    }
                    else {
                        primitiveAccumulator.push(arg);
                        argsAccumulator = arg;
                    }
                }
            });
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(argsAccumulator, primitiveAccumulator.length ? primitiveAccumulator : undefined);
            argsAccumulator = shouldAggregate ? undefined : {};
            primitiveAccumulator = [];
        }, wait);
    };
}
//# sourceMappingURL=debounce.js.map