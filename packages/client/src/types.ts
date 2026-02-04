import { MedusaResponse } from "@medusajs/framework/http";

export type ActionType = "query" | "mutate" | "delete";

type PrettifyDeep<T> = T extends (...args: any[]) => any
    ? T
    : T extends Array<infer U>
    ? Array<PrettifyDeep<U>>
    : T extends Date
    ? T
    : T extends object
    ? { [K in keyof T]: PrettifyDeep<T[K]> } & {}
    : T;

type HttpMethod = "GET" | "POST" | "DELETE";

// Get keys that are not HTTP methods or internal module properties (i.e., child routes)
type ChildKeys<T> = Exclude<keyof T, HttpMethod | "__esModule">;

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
    TInput = TRequest extends { validatedBody: infer Input } ? Input : void,
    TOutput = TResponse extends MedusaResponse<infer Output> ? Output : void,
> = TInput extends Record<string, any>
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

const _errorSymbol = Symbol();
export type ErrorSymbol = typeof _errorSymbol;

export type TypeError<TMessage extends string> = TMessage & {
    _: typeof _errorSymbol;
};

export type InferClient<TRoutes> = TRoutes extends Record<string, any>
    ? PrettifyDeep<ProcessRoutes<TRoutes>>
    : TypeError<`Looks like you forgot to pass the \`Routes\` generic type to the \`createClient\` function.`>

export type AnyClient = InferClient<any>;

export type ClientOptions = {
    baseUrl: string;
    fetchOptions?: RequestInit;
}