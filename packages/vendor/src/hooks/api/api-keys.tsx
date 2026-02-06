import { HttpTypes } from "@medusajs/types"
import { ClientError } from "@mercurjs/client"
import {
  MutationOptions,
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
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminApiKeyResponse,
      ClientError,
      HttpTypes.AdminApiKeyResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.apiKeys.$id.query({ id }),
    queryKey: apiKeysQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useApiKeys = (
  query?: HttpTypes.AdminGetApiKeysParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminGetApiKeysParams,
      ClientError,
      HttpTypes.AdminApiKeyListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.apiKeys.query(query),
    queryKey: apiKeysQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateApiKey = (
  options?: UseMutationOptions<
    HttpTypes.AdminApiKeyResponse,
    ClientError,
    HttpTypes.AdminCreateApiKey
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.apiKey.create(payload),
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
    HttpTypes.AdminApiKeyResponse,
    ClientError,
    HttpTypes.AdminUpdateApiKey
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.apiKey.update(id, payload),
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
  options?: UseMutationOptions<HttpTypes.AdminApiKeyResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.apiKey.revoke(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })

      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useDeleteApiKey = (
  id: string,
  options?: MutationOptions<
    HttpTypes.AdminApiKeyDeleteResponse,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.apiKey.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) })

      options?.onSuccess?.(data, variables, context)
    },
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
      sdk.admin.apiKey.batchSalesChannels(id, { remove: payload }),
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
      sdk.admin.apiKey.batchSalesChannels(id, { add: payload }),
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
