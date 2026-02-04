import { createRecursiveProxy } from "@/create-proxy";
import { AnyClient } from "@/types";
import { skipToken, UseMutationOptions } from "@tanstack/react-query";

type ReactQueryAction = "queryOptions" | "mutationOptions" | "queryKey";

export function createClientOptionsProxy<TRoutes>({
    client,
}: {
    client: AnyClient;
}) {
    return createRecursiveProxy((path, args) => {
        const action = path.pop() as ReactQueryAction;
        const segments = path.slice(0, -1);
        const [input, options] = args

        const inputIsSkipToken = input === skipToken;

        // Navigate to the client method
        const clientMethod = path.reduce(
            (acc, key) => acc[key as keyof typeof acc],
            client as Record<string, any>
        );

        const queryKey = [...segments, input] as const;

        if (action === "queryOptions") {
            return {
                queryKey,
                queryFn: inputIsSkipToken
                    ? skipToken
                    : () => clientMethod.query(input),
                ...(options ?? {}),
            };
        }

        if (action === "mutationOptions") {
            return {
                mutationFn: clientMethod.mutate,
                ...(input as UseMutationOptions<any, any, any>),
            };
        }

        if (action === "queryKey") {
            return queryKey;
        }
    })
}
