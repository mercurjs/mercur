import { createRecursiveProxy } from "@/create-proxy";
import { AnyClient } from "@/types";
import { skipToken } from "@tanstack/react-query";

type ReactQueryAction = "queryOptions" | "mutationOptions" | "queryKey";

export function createReactQueryClientOptions<TRoutes>({
    client,
}: {
    client: AnyClient;
}) {
    return createRecursiveProxy((path, args) => {
        const action = path.pop() as ReactQueryAction;
        const input = args[0];

        const inputIsSkipToken = input === skipToken;

        // Navigate to the client method
        const clientMethod = path.reduce(
            (acc, key) => acc[key as keyof typeof acc],
            client as Record<string, any>
        );

        const queryKey = [...path, input] as const;

        if (action === "queryOptions") {
            return {
                queryKey,
                queryFn: inputIsSkipToken
                    ? skipToken
                    : () => clientMethod.query(input),
            };
        }

        if (action === "mutationOptions") {
            return {
                mutationFn: clientMethod.mutate,
            };
        }

        if (action === "queryKey") {
            return queryKey;
        }
    })
}
