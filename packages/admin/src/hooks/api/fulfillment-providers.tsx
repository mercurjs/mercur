import type { FetchError } from "@medusajs/js-sdk"
import type { HttpTypes } from "@medusajs/types"
import { type  QueryKey, useQuery, type UseQueryOptions } from "@tanstack/react-query"
import type { ExtendedAdminFulfillmentProviderOptionsListResponse } from "@custom-types/fulfillment-providers/common"
import { queryKeysFactory } from "@lib/query-key-factory"
import { sdk } from "@lib/client"

const FULFILLMENT_PROVIDERS_QUERY_KEY = "fulfillment_providers" as const
export const fulfillmentProvidersQueryKeys = queryKeysFactory(
  FULFILLMENT_PROVIDERS_QUERY_KEY
)

const FULFILLMENT_PROVIDER_OPTIONS_QUERY_KEY =
  "fulfillment_provider_options" as const
export const fulfillmentProviderOptionsQueryKeys = queryKeysFactory(
  FULFILLMENT_PROVIDER_OPTIONS_QUERY_KEY
)

export const useFulfillmentProviders = (
  query?: HttpTypes.AdminFulfillmentProviderListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminFulfillmentProviderListResponse,
      FetchError,
      HttpTypes.AdminFulfillmentProviderListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.fulfillmentProvider.list(query),
    queryKey: fulfillmentProvidersQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useFulfillmentProviderOptions = (
  providerId: string,
  options?: Omit<
    UseQueryOptions<
      ExtendedAdminFulfillmentProviderOptionsListResponse,
      FetchError,
      ExtendedAdminFulfillmentProviderOptionsListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.fulfillmentProvider.listFulfillmentOptions(providerId) as Promise<ExtendedAdminFulfillmentProviderOptionsListResponse>,
    queryKey: fulfillmentProviderOptionsQueryKeys.list(providerId),
    ...options,
  })

  return { ...data, ...rest }
}
