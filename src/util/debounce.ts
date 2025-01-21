type DebounceOptions = {
  wait?: number; // Default is 50
  shouldAggregate?: boolean; // Default is true
};

/**
 * Debouncing function that allows for accumulating arguments that are passed to the debounced function after the delay period has elapsed without subsuquent calls.
 * - Calling the debounced function multiple times with an array will concatenate the arguments into a single array.
 * - Calling the debounced function multiple times with an object will merge the arguments into a single object.
 * - Calling the debounced function multiple times with primitives will return the last primitive, and a second argument will be passed with an array of all primitives passed.
 * - Aggregation can be disabled by passing "false" as the third argument to the factory.
 *
 * @param func The function to debounce.
 * @param options Debounce configuration options.
 * @returns A debounced version of the input function.
 */

export function debounce<T extends (...args: any[]) => any>(func: T, options?: DebounceOptions): T {
  let timeout: ReturnType<typeof setTimeout>;
  let argsAccumulator: any = options?.shouldAggregate ? [] : undefined;
  let primitiveAccumulator: Parameters<T>[0][] = [];

  return function (...args: Parameters<T>): ReturnType<T> {
    if (!options?.shouldAggregate) {
      argsAccumulator = args[args.length - 1];
    } else {
      if (!argsAccumulator) {
        argsAccumulator = [];
      }

      args.forEach((arg) => {
        if (arg !== undefined && arg !== null) {
          if (Array.isArray(arg)) {
            argsAccumulator = [...argsAccumulator, ...arg];
          } else if (typeof arg === 'object') {
            argsAccumulator.push(arg);
          } else {
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
        } catch (error) {
          reject(error);
        }
      }, options?.wait ?? 50);
    }) as ReturnType<T>;
  } as T;
}
