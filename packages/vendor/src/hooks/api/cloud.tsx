import { ClientError } from "@mercurjs/client"
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"

export const cloudQueryKeys = {
  all: ["cloud"] as const,
  auth: () => [...cloudQueryKeys.all, "auth"] as const,
}

export const useCloudAuthEnabled = (
  options?: Omit<
    UseQueryOptions<{ enabled: boolean }, ClientError>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: cloudQueryKeys.auth(),
    queryFn: async () => {
      return await sdk.client.fetch<{ enabled: boolean }>("/cloud/auth")
    },
    ...options,
  })
}

export const useCreateCloudAuthUser = (
  options?: UseMutationOptions<void, ClientError>
) => {
  return useMutation({
    mutationFn: async () => {
      await sdk.client.fetch("/cloud/auth/users", {
        method: "POST",
      })
    },
    ...options,
  })
}
