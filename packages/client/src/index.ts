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

type PathToObject<
    T extends string,
    Fn extends (...args: any[]) => any,
    TType extends RouteType,
> = T extends `/${infer Segment}/${infer Rest}`
    ? { [K in CamelCase<Segment>]: PathToObject<`/${Rest}`, Fn, TType> }
    : T extends `/${infer Segment}`
    ? { [K in CamelCase<Segment>]: { [R in TType]: Fn } }
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

type InferRoutes<TRoutes> =
    TRoutes extends Record<infer TRoute, infer TEndpoint>
    ? TRoute extends string
    ? TEndpoint extends Record<string, (...args: any[]) => any>
    ? TEndpoint extends {
        GET: (
            req: infer TRequest,
            res: infer TResponse,
        ) => any;
    }
    ? PathToObject<TRoute, InferFetchFn<TRequest, TResponse>, "query">
    : never
    : never
    : never
    : never;

export type InferClient<TRoutes> = PrettifyDeep<UnionToIntersection<InferRoutes<TRoutes>>>