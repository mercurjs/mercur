import {
  MutationOptions,
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { HttpTypes } from "@medusajs/types"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { pricePreferencesQueryKeys } from "./price-preferences"
import { sdk } from "../../lib/client"
import { ClientError } from "@mercurjs/client"

const STORE_QUERY_KEY = "store" as const
export const storeQueryKeys = queryKeysFactory(STORE_QUERY_KEY)

/**
 * Workaround to keep the V1 version of retrieving the store.
 */
export async function retrieveActiveStore(
  query?: HttpTypes.AdminStoreParams
): Promise<HttpTypes.AdminStoreResponse> {
  const response = await sdk.admin.stores.query({})

  const activeStore = response.stores?.[0]

  if (!activeStore) {
    throw new ClientError("No active store found", "Not Found", 404)
  }

  return { store: activeStore }
}

export const useStore = (
  query?: HttpTypes.SelectParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStoreResponse,
      ClientError,
      HttpTypes.AdminStoreResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => retrieveActiveStore(query),
    queryKey: storeQueryKeys.details(),
    ...options,
  })

  return {
    ...data,
    ...rest,
  }
}

export const useUpdateStore = (
  id: string,
  options?: MutationOptions<
    HttpTypes.AdminStoreResponse,
    ClientError,
    HttpTypes.AdminUpdateStore
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.stores.$id.mutate({id, ...payload}),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      })
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.details(),
      })
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.details() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
