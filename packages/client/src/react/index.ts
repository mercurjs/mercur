import { skipToken } from "@tanstack/react-query";
import { createRecursiveProxy, InferClient } from "..";

type ReactQueryAction = "queryOptions" | "mutationOptions" | "queryKey";

/**
 * Creates a proxy that provides TanStack Query options for your API routes.
 *
 * @example
 * ```ts
 * import { createClient } from "@mercurjs/client";
 * import { createClientOptions } from "@mercurjs/client/react";
 *
 * const client = createClient<Routes>({ baseUrl: "/api" });
 * const api = createClientOptions(client);
 *
 * // Query options
 * useQuery(api.admin.products.queryOptions({ limit: 10 }));
 *
 * // With skipToken for conditional queries
 * useQuery(api.admin.products.queryOptions(enabled ? { limit: 10 } : skipToken));
 *
 * // Mutation options
 * useMutation(api.admin.products.mutationOptions());
 *
 * // Get query key for invalidation
 * queryClient.invalidateQueries({ queryKey: api.admin.products.queryKey() });
 * ```
 */
export function createReactQueryClientOptions<TClient extends InferClient<unknown>>({
    client
}: {
    client: TClient;
}) {
    return createRecursiveProxy((path, args) => {
        const action = path.pop() as ReactQueryAction;
        const segments = path.slice(0, -1);
        const input = args[0];

        const inputIsSkipToken = input === skipToken;

        // Navigate to the client method
        const clientMethod = path.reduce((acc, key) => (acc as any)[key], client);

        const queryKey = [...segments, input];

        if (action === "queryOptions") {
            return {
                queryKey,
                queryFn: inputIsSkipToken
                    ? skipToken
                    : () => (clientMethod as any).query(input),
            };
        }

        if (action === "mutationOptions") {
            return {
                mutationFn: (clientMethod as any).mutate,
            };
        }

        if (action === "queryKey") {
            return queryKey;
        }
    });
}
