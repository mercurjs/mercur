import { type MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

type RouteType = "mutate" | "query" | "delete";

type PrettifyDeep<T> = T extends (...args: any[]) => any
    ? T
    : T extends Array<infer U>
    ? Array<PrettifyDeep<U>>
    : T extends Date
    ? T
    : T extends object
    ? { [K in keyof T]: PrettifyDeep<T[K]> } & {}
    : T;

type CamelCase<S extends string> =
    S extends `${infer P1}-${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

// Extract all path params: "/admin/products/:id/variants/:variantId" → { id: string, variantId: string }
type ExtractParams<T extends string> =
    T extends `${string}/:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractParams<`/${Rest}`>
    : T extends `${string}/:${infer Param}`
    ? { [K in Param]: string }
    : {};

// Merge params into function input
type AddParamsToFn<Fn, TParams> =
    keyof TParams extends never
    ? Fn
    : Fn extends (input?: infer TInput) => infer TOutput
    ? (input: PrettifyDeep<(TInput extends Record<string, any> ? Omit<TInput, 'fetchOptions'> : {}) & TParams & { fetchOptions?: RequestInit }>) => TOutput
    : Fn extends (input: infer TInput) => infer TOutput
    ? (input: PrettifyDeep<(TInput extends Record<string, any> ? Omit<TInput, 'fetchOptions'> : {}) & TParams & { fetchOptions?: RequestInit }>) => TOutput
    : Fn;

type PathToObject<
    T extends string,
    Fn extends (...args: any[]) => any,
    TType extends RouteType,
    TParams = ExtractParams<T>,
> = T extends `/:${infer Param}/${infer Rest}`
    ? { [K in `$${Param}`]: PathToObject<`/${Rest}`, Fn, TType, TParams> }
    : T extends `/${infer Segment}/${infer Rest}`
    ? { [K in CamelCase<Segment>]: PathToObject<`/${Rest}`, Fn, TType, TParams> }
    : T extends `/:${infer Param}`
    ? { [K in `$${Param}`]: { [R in TType]: AddParamsToFn<Fn, TParams> } }
    : T extends `/${infer Segment}`
    ? { [K in CamelCase<Segment>]: { [R in TType]: AddParamsToFn<Fn, TParams> } }
    : never;


type UnionToIntersection<U> = (
    U extends any ? (k: U) => void : never
) extends (k: infer I) => void
    ? I
    : never;

type ExpandFn<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T;

type InferFetchFn<
    TRequest,
    TResponse,
    TInput = TRequest extends MedusaRequest<infer TInput> ? TInput : void,
    TOutput = TResponse extends MedusaResponse<infer TOutput> ? TOutput : void,
> = ExpandFn<TInput extends Record<string, any> ? (input: PrettifyDeep<TInput & { fetchOptions?: RequestInit }>) => PrettifyDeep<TOutput> : (input?: { fetchOptions?: RequestInit }) => PrettifyDeep<TOutput>>

type InferGetRoute<TRoute extends string, TEndpoint> =
    TEndpoint extends { GET: (req: infer TReq, res: infer TRes) => any }
    ? PathToObject<TRoute, InferFetchFn<TReq, TRes>, "query">
    : never;

type InferPostRoute<TRoute extends string, TEndpoint> =
    TEndpoint extends { POST: (req: infer TReq, res: infer TRes) => any }
    ? PathToObject<TRoute, InferFetchFn<TReq, TRes>, "mutate">
    : never;

type InferDeleteRoute<TRoute extends string, TEndpoint> =
    TEndpoint extends { DELETE: (req: infer TReq, res: infer TRes) => any }
    ? PathToObject<TRoute, InferFetchFn<TReq, TRes>, "delete">
    : never;

type InferRoutes<TRoutes, TRoute = keyof TRoutes> =
    TRoute extends keyof TRoutes
    ? TRoute extends string
    ? TRoutes[TRoute] extends Record<string, (...args: any[]) => any>
    ? InferGetRoute<TRoute, TRoutes[TRoute]> | InferPostRoute<TRoute, TRoutes[TRoute]> | InferDeleteRoute<TRoute, TRoutes[TRoute]>
    : never
    : never
    : never;

export type InferClient<TRoutes> = PrettifyDeep<UnionToIntersection<InferRoutes<TRoutes>>>

export type ClientOptions = {
    baseUrl: string;
    fetchOptions?: RequestInit;
}