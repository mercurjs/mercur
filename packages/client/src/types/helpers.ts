import { MedusaResponse } from "@medusajs/framework";

const _errorSymbol = Symbol();
export type ErrorSymbol = typeof _errorSymbol;

export type TypeError<TMessage extends string> = TMessage

export type InferInput<TRequest> = TRequest extends { validatedBody: infer Input }
    ? Input
    : void;

export type InferOutput<TResponse> = TResponse extends MedusaResponse<infer Output>
    ? Output
    : void;

export type HttpMethod = "GET" | "POST" | "DELETE";

// Get keys that are not HTTP methods or internal module properties (i.e., child routes)
export type ChildKeys<T> = Exclude<keyof T, HttpMethod | "__esModule">;