import { stringify } from "qs";
import { createRecursiveProxy } from "./create-proxy";
import { ActionType, ClientOptions, InferClient } from "./types";
import { kebabCase } from "./utils";

export type InferClientInput<T> = T extends (input: infer I) => any
    ? Omit<I, 'fetchOptions'>
    : T extends (input?: infer I) => any
    ? Omit<NonNullable<I>, 'fetchOptions'>
    : never;

export type InferClientOutput<T> = T extends (...args: any[]) => Promise<infer O>
    ? O
    : never;

export class ClientError extends Error {
    status: number | undefined;
    statusText: string | undefined;

    constructor(message: string, statusText?: string, status?: number) {
        super(message);
        this.statusText = statusText;
        this.status = status;
    }
}

export function createClient<TRoutes>(options: ClientOptions): InferClient<TRoutes> {
    const { baseUrl, fetchOptions: defaultFetchOptions } = options;

    return createRecursiveProxy((path, args) => {
        const action = path.pop() as ActionType;
        const input: Record<string, any> = args[0] ?? {};

        const method =
            action === "query" ? "GET" : action === "mutate" ? "POST" : "DELETE";

        const { fetchOptions: inputFetchOptions, ...rest } = input;

        const urlParts = path.map((segment) => {
            if (segment.startsWith("$")) {
                const paramName = segment.slice(1);
                const value = rest[paramName];
                delete rest[paramName];
                return String(value);
            }
            return kebabCase(segment);
        });

        const urlPath = "/" + urlParts.join("/");

        const base = new URL(baseUrl);
        const fullPath = `${base.pathname.replace(/\/$/, "")}/${urlPath.replace(/^\//, "")}`;
        const url = new URL(fullPath, base.origin);

        let body: string | undefined;

        if (method === "GET" && Object.keys(rest).length > 0) {
            url.search = stringify(rest, { skipNulls: true });
        } else if (method !== "GET" && Object.keys(rest).length > 0) {
            body = JSON.stringify(rest);
        }

        const headers = new Headers({
            "Content-Type": "application/json",
            Accept: "application/json",
            ...defaultFetchOptions?.headers,
            ...inputFetchOptions?.headers,
        });

        return fetch(url, {
            ...defaultFetchOptions,
            ...inputFetchOptions,
            method,
            body,
            headers,
        }).then(async (response) => {
            if (response.status >= 300) {
                const jsonError = (await response.json().catch(() => ({}))) as {
                    message?: string;
                };
                throw new ClientError(
                    jsonError.message ?? response.statusText,
                    response.statusText,
                    response.status
                );
            }

            const isJsonRequest = headers.get("accept")?.includes("application/json");
            return isJsonRequest ? await response.json() : response;
        });
    }) as InferClient<TRoutes>;
}
