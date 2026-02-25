import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { salesChannelsQueryKeys } from "./sales-channels"

const API_KEYS_QUERY_KEY = "api_keys" as const
export const apiKeysQueryKeys = queryKeysFactory(API_KEYS_QUERY_KEY)

export const useApiKey = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.apiKeys.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.apiKeys.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.apiKeys.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.apiKeys.$id.query({ $id: id, ...query }),
    queryKey: apiKeysQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useApiKeys = (
  query?: InferClientInput<typeof sdk.admin.apiKeys.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.apiKeys.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.apiKeys.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.apiKeys.query({ ...query }),
    queryKey: apiKeysQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateApiKey = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.apiKeys.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.apiKeys.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.apiKeys.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.apiKeys.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRevokeApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.revoke.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.apiKeys.$id.revoke.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.apiKeys.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchRemoveSalesChannelsFromApiKey = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminApiKeyResponse,
    ClientError,
    HttpTypes.AdminBatchLink["remove"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.apiKeys.$id.salesChannels.mutate({ $id: id, remove: payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchAddSalesChannelsToApiKey = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminApiKeyResponse,
    ClientError,
    HttpTypes.AdminBatchLink["add"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.apiKeys.$id.salesChannels.mutate({ $id: id, add: payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
