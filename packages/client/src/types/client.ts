import type { AuthOption } from "../auth";
import { ChildKeys, InferInput, InferOutput, TypeError } from "./helpers";

export type ActionType = "query" | "mutate" | "delete";

export type ClientOptions = {
    baseUrl: string;
    fetchOptions?: RequestInit;
    /**
     * How requests authenticate: a token store (sent as a bearer token), one
     * scheme, or several. Resolved on every request, so a token set after the
     * client was created is picked up by the next call.
     */
    auth?: AuthOption;
    /** Extra headers computed per request, on top of `auth`. */
    headers?: () => Record<string, string> | Promise<Record<string, string>>;
    /**
     * Runs when the API answers 401. By default the bearer token stores in
     * `auth` are cleared so the panel falls back to its login screen.
     */
    onUnauthorized?: (error: { status: number; message: string }) => void;
};

type AddParamsToFn<Fn, TParams> =
    keyof TParams extends never
    ? Fn
    : Fn extends (input?: infer TInput) => infer TOutput
    ? (input: (TInput extends Record<string, any> ? Omit<TInput, 'fetchOptions'> : {}) & TParams & { fetchOptions?: RequestInit }) => TOutput
    : Fn extends (input: infer TInput) => infer TOutput
    ? (input: (TInput extends Record<string, any> ? Omit<TInput, 'fetchOptions'> : {}) & TParams & { fetchOptions?: RequestInit }) => TOutput
    : Fn;

type InferFetchFn<
    TRequest,
    TResponse,
    TInput = InferInput<TRequest>,
    TOutput = InferOutput<TResponse>,
> = [TInput] extends [Record<string, any>]
    ? (input: TInput & { fetchOptions?: RequestInit }) => Promise<TOutput>
    : (input?: { fetchOptions?: RequestInit }) => Promise<TOutput>;

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
        [K in ChildKeys<TRoutes>]: K extends `$${string}`
        ? ProcessRoutes<TRoutes[K], TParams & { [P in K]: string }>
        : ProcessRoutes<TRoutes[K], TParams>
    };

export type InferClient<TRoutes> = TRoutes extends Record<string, any>
    ? ProcessRoutes<TRoutes>
    : TypeError<`Looks like you forgot to pass the \`Routes\` generic type to the \`createClient\` function.`>;


export type AnyClient = InferClient<any>;
