export type Resolve<T, R> = (value: T | PromiseLike<T>) => R;

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Reject<R> =  (reason?: any) => R;

export type Executor<T, R> = (resolve: Resolve<T, R>, reject: Reject<R>) => void;