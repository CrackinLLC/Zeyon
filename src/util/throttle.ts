// Debouncing function that allows for accumulating arguments that are passed to the debounced function after the delay period has elapsed without subsuquent calls.
// - Calling the debounced function multiple times with an array will concatenate the arguments into a single array.
// - Calling the debounced function multiple times with an object will merge the arguments into a single object.
// - Calling the debounced function multiple times with primitives will return the last primitive, and a second argument will be passed with an array of all primitives passed.
// - Aggregation can be disabled by passing "false" as the third argument to the factory.
export function debounce<T>(
  func: (aggregatedArgs: T, collectedPrimitives?: T[]) => void,
  { wait = 50, shouldAggregate = true }: { wait?: number; shouldAggregate?: boolean } = {},
): (...args: T[]) => void {
  let timeout: ReturnType<typeof setTimeout>;
  let argsAccumulator: any = shouldAggregate ? undefined : {}; // Accumulates objects or arrays
  let primitiveAccumulator: T[] = [];

  return function (...args: T[]) {
    if (!shouldAggregate) {
      argsAccumulator = args[args.length - 1]; // Take only the last argument when aggregation is disabled
    } else {
      if (argsAccumulator === undefined) {
        // Initialize `argsAccumulator` as an array since you're passing objects
        argsAccumulator = [];
      }

      args.forEach((arg) => {
        if (arg !== undefined && arg !== null) {
          if (Array.isArray(arg)) {
            // Concatenate arrays
            argsAccumulator = [...argsAccumulator, ...arg];
          } else if (typeof arg === 'object') {
            // Push objects into the accumulator array
            argsAccumulator.push(arg);
          } else {
            // For primitives, keep the last one in `argsAccumulator` and accumulate others in `primitiveAccumulator`
            primitiveAccumulator.push(arg);
            argsAccumulator = arg; // Keep the last primitive value
          }
        }
      });
    }

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(argsAccumulator, primitiveAccumulator.length ? primitiveAccumulator : undefined);
      argsAccumulator = shouldAggregate ? undefined : {}; // Reset after invoking the function
      primitiveAccumulator = []; // Clear primitive accumulator
    }, wait);
  };
}
