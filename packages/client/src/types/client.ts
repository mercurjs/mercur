import { ChildKeys, InferInput, InferOutput, PrettifyDeep, TypeError } from "./helpers";

export type ActionType = "query" | "mutate" | "delete";

export type ClientOptions = {
    baseUrl: string;
    fetchOptions?: RequestInit;
};

type AddParamsToFn<Fn, TParams> =
    keyof TParams extends never
    ? Fn
    : Fn extends (input?: infer TInput) => infer TOutput
    ? (input: PrettifyDeep<(TInput extends Record<string, any> ? Omit<TInput, 'fetchOptions'> : {}) & TParams & { fetchOptions?: RequestInit }>) => TOutput
    : Fn extends (input: infer TInput) => infer TOutput
    ? (input: PrettifyDeep<(TInput extends Record<string, any> ? Omit<TInput, 'fetchOptions'> : {}) & TParams & { fetchOptions?: RequestInit }>) => TOutput
    : Fn;

type InferFetchFn<
    TRequest,
    TResponse,
    TInput = InferInput<TRequest>,
    TOutput = InferOutput<TResponse>,
> = [TInput] extends [Record<string, any>]
    ? (input: PrettifyDeep<TInput & { fetchOptions?: RequestInit }>) => Promise<PrettifyDeep<TOutput>>
    : (input?: { fetchOptions?: RequestInit }) => Promise<PrettifyDeep<TOutput>>;

type InferEndpointMethods<TRoutes, TParams> =
    (TRoutes extends { GET: (req: infer TReq, res: infer TRes) => any }
        ? { query: AddParamsToFn<InferFetchFn<TReq, TRes>, TParams> }
        : {}) &
    (TRoutes extends { POST: (req: infer TReq, res: infer TRes) => any }
        ? { mutate: AddParamsToFn<InferFetchFn<TReq, TRes>, TParams> }
        : {}) &
    (TRoutes extends { DELETE: (req: infer TReq, res: infer TRes) => any }
        ? { delete: AddParamsToFn<InferFetchFn<TReq, TRes>, TParams> }
        : {});

type ProcessRoutes<TRoutes, TParams = {}> =
    InferEndpointMethods<TRoutes, TParams> &
    {
        [K in ChildKeys<TRoutes>]: K extends `$${infer Param}`
        ? ProcessRoutes<TRoutes[K], TParams & { [P in Param]: string }>
        : ProcessRoutes<TRoutes[K], TParams>
    };

export type InferClient<TRoutes> = TRoutes extends Record<string, any>
    ? PrettifyDeep<ProcessRoutes<TRoutes>>
    : TypeError<`Looks like you forgot to pass the \`Routes\` generic type to the \`createClient\` function.`>;


export type AnyClient = InferClient<any>;
