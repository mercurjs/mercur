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
import { fetchQuery } from "../../lib/client"
import { ClientError } from "@mercurjs/client"

const STORE_QUERY_KEY = "store" as const
export const storeQueryKeys = queryKeysFactory(STORE_QUERY_KEY)

/**
 * Fetches the current seller as a store-like object.
 * Uses /vendor/sellers/me since /vendor/stores does not exist.
 */
export async function retrieveActiveStore(
  query?: HttpTypes.AdminStoreParams
): Promise<HttpTypes.AdminStoreResponse> {
  const response = await fetchQuery('/vendor/sellers/me', {
    method: "GET",
    query,
  })

  const seller = (response as any).seller

  if (!seller) {
    throw new ClientError("No active seller found", "Not Found", 404)
  }

  return { store: seller as HttpTypes.AdminStore }
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
    mutationFn: (payload) => fetchQuery('/vendor/sellers/me', { method: "POST", body: payload }),
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
