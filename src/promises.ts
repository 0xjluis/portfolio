export type Resolve<T, R> = (value: T | PromiseLike<T>) => R;

export type Reject<R> =  (reason?: unknown) => R;

export type Executor<T, R> = (resolve: Resolve<T, R>, reject: Reject<R>) => void;