export function debounce(func, options) {
    let timeout;
    let argsAccumulator = options?.shouldAggregate ? [] : undefined;
    let primitiveAccumulator = [];
    return function (...args) {
        if (!options?.shouldAggregate) {
            argsAccumulator = args[args.length - 1];
        }
        else {
            if (!argsAccumulator) {
                argsAccumulator = [];
            }
            args.forEach((arg) => {
                if (arg !== undefined && arg !== null) {
                    if (Array.isArray(arg)) {
                        argsAccumulator = [...argsAccumulator, ...arg];
                    }
                    else if (typeof arg === 'object') {
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
        return new Promise((resolve, reject) => {
            timeout = setTimeout(async () => {
                try {
                    const result = await func(argsAccumulator, primitiveAccumulator.length ? primitiveAccumulator : undefined);
                    argsAccumulator = options?.shouldAggregate ? [] : undefined;
                    primitiveAccumulator = [];
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            }, options?.wait ?? 50);
        });
    };
}
//# sourceMappingURL=debounce.js.map