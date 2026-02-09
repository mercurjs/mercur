import { MedusaResponse } from "@medusajs/framework/http";

type DecrementDepth = [never, 0, 1, 2, 3, 4, 5, 6];

export type PrettifyDeep<T, Depth extends number = 4> = Depth extends never
    ? T
    : T extends (...args: any[]) => any
    ? T
    : T extends Array<infer U>
    ? Array<PrettifyDeep<U, DecrementDepth[Depth]>>
    : T extends Date
    ? T
    : T extends object
    ? { [K in keyof T]: PrettifyDeep<T[K], DecrementDepth[Depth]> } & {}
    : T;

const _errorSymbol = Symbol();
export type ErrorSymbol = typeof _errorSymbol;

export type TypeError<TMessage extends string> = TMessage & {
    _: typeof _errorSymbol;
};

export type InferInput<TRequest> = TRequest extends { validatedBody: infer Input }
    ? Input
    : void;

export type InferOutput<TResponse> = TResponse extends MedusaResponse<infer Output>
    ? Output
    : void;

export type HttpMethod = "GET" | "POST" | "DELETE";

// Get keys that are not HTTP methods or internal module properties (i.e., child routes)
export type ChildKeys<T> = Exclude<keyof T, HttpMethod | "__esModule">;