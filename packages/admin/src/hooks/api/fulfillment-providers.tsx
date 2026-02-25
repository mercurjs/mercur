import type { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
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
  query?: InferClientInput<typeof sdk.admin.fulfillmentProviders.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.fulfillmentProviders.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.fulfillmentProviders.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.fulfillmentProviders.query({ ...query }),
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
      ClientError,
      ExtendedAdminFulfillmentProviderOptionsListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.fulfillmentProviders.$id.options.query({ $id: providerId }) as Promise<ExtendedAdminFulfillmentProviderOptionsListResponse>,
    queryKey: fulfillmentProviderOptionsQueryKeys.list(providerId),
    ...options,
  })

  return { ...data, ...rest }
}
