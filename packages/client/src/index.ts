import { stringify } from "qs";
import { ClientOptions, InferClient } from "./types";
import { kebabCase } from '@medusajs/utils'
export { InferClient, ClientOptions } from "./types";

export class ClientError extends Error {
    status: number | undefined
    statusText: string | undefined

    constructor(message: string, statusText?: string, status?: number) {
        super(message)
        this.statusText = statusText
        this.status = status
    }
}

export function createClient<TRoutes>(options: ClientOptions): InferClient<TRoutes> {
    const { baseUrl, fetchOptions: defaultFetchOptions } = options;

    function createProxy(path: string[] = []): any {
        return new Proxy(function () { }, {
            get(_, prop) {
                if (typeof prop !== "string") {
                    return undefined;
                }

                // Ignore promise-like properties
                if (prop === "then" || prop === "catch" || prop === "finally") {
                    return undefined;
                }

                // Check if this is a method call (query, mutate, delete)
                if (prop === "query" || prop === "mutate" || prop === "delete") {
                    const method =
                        prop === "query" ? "GET" :
                            prop === "mutate" ? "POST" :
                                "DELETE";

                    return async (input: Record<string, any> = {}) => {
                        const { fetchOptions: inputFetchOptions, ...rest } = input;

                        // Build URL, replacing $param segments with values from input
                        const urlParts = path.map(segment => {
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
                            "Accept": "application/json",
                            ...defaultFetchOptions?.headers,
                            ...inputFetchOptions?.headers,
                        });

                        const response = await fetch(url, {
                            ...defaultFetchOptions,
                            ...inputFetchOptions,
                            method,
                            body,
                            headers,
                        });

                        if (response.status >= 300) {
                            const jsonError = (await response.json().catch(() => ({}))) as {
                                message?: string
                            }
                            throw new ClientError(
                                jsonError.message ?? response.statusText,
                                response.statusText,
                                response.status
                            )
                        }

                        const isJsonRequest = headers.get("accept")?.includes("application/json")
                        return isJsonRequest ? await response.json() : response
                    };
                }

                return createProxy([...path, prop]);
            },
        });
    }

    return createProxy() as InferClient<TRoutes>;
}