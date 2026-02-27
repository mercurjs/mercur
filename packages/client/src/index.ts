import qs from "qs";
import { createRecursiveProxy } from "./create-proxy";
import { ActionType, ClientOptions, InferClient, PrettifyDeep } from "./types";
export type { InferClient } from "./types";
import { kebabCase } from "./utils";

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type InferClientInput<T> = T extends (input: infer I) => any
    ? PrettifyDeep<DistributiveOmit<I, 'fetchOptions'>>
    : T extends (input?: infer I) => any
    ? PrettifyDeep<DistributiveOmit<NonNullable<I>, 'fetchOptions'>>
    : never;

export type InferClientOutput<T> = T extends (...args: any[]) => Promise<infer O>
    ? PrettifyDeep<O>
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

export function createClient(options: ClientOptions) {
    const { baseUrl, fetchOptions: defaultFetchOptions } = options;

    return createRecursiveProxy((path, args) => {
        const action = path.pop() as ActionType;
        const input: Record<string, any> = args[0] ?? {};

        const method =
            action === "query" ? "GET" : action === "mutate" ? "POST" : action === "delete" ? "DELETE" : null;

        if (!method) {
            throw new Error(`Action '${action}' is not a valid action.`);
        }

        const { fetchOptions: inputFetchOptions, ...rest } = input;

        const urlParts = path.map((segment) => {
            if (segment.startsWith("$")) {
                const value = rest[segment];
                delete rest[segment];
                return String(value);
            }
            return kebabCase(segment);
        });

        const urlPath = "/" + urlParts.join("/");

        const base = new URL(baseUrl);
        const fullPath = `${base.pathname.replace(/\/$/, "")}/${urlPath.replace(/^\//, "")}`;
        const url = new URL(fullPath, base.origin);

        const isFormData = inputFetchOptions?.body instanceof FormData;

        let body: string | FormData | undefined;

        if (isFormData) {
            body = inputFetchOptions!.body as FormData;
        } else if (method === "GET" && Object.keys(rest).length > 0) {
            url.search = qs.stringify(rest, { skipNulls: true });
        } else if (method !== "GET" && Object.keys(rest).length > 0) {
            body = JSON.stringify(rest);
        }

        const defaultHeaders: Record<string, string> = {
            Accept: "application/json",
        };

        if (!isFormData) {
            defaultHeaders["Content-Type"] = "application/json";
        }

        const headers = new Headers({
            ...defaultHeaders,
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
    })
}
