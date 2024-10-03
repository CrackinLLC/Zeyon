interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

interface PromiseConstructor {
  withResolvers<T>(): PromiseWithResolvers<T>;
}

if (!Promise.withResolvers) {
  Promise.withResolvers = function <T>(): PromiseWithResolvers<T> {
    if (!this)
      throw new TypeError("Promise.withResolvers called on non-object");

    const out: PromiseWithResolvers<T> = {} as PromiseWithResolvers<T>;

    out.promise = new this(
      (
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
      ) => {
        out.resolve = resolve;
        out.reject = reject;
      }
    );

    return out;
  };
}
