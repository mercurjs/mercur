export type ProxyCallback = (path: string[], args: unknown[]) => unknown;

export function createRecursiveProxy(callback: ProxyCallback, path: string[] = []): any {
    return new Proxy(function () { }, {
        get(_, prop) {
            if (typeof prop !== "string") {
                return undefined;
            }

            if (prop === "then" || prop === "catch" || prop === "finally") {
                return undefined;
            }

            return createRecursiveProxy(callback, [...path, prop]);
        },
        apply(_, __, args) {
            return callback(path, args);
        },
    });
}
