import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { fulfillmentProvidersQueryKeys } from "./fulfillment-providers"
import { VendorExtendedAdminStockLocationResponse } from "../../types/stock-location"

const STOCK_LOCATIONS_QUERY_KEY = "stock_locations" as const
export const stockLocationsQueryKeys = queryKeysFactory(
  STOCK_LOCATIONS_QUERY_KEY
)

export const useStockLocation = (
  id: string,
  query?: HttpTypes.SelectParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStockLocationResponse,
      FetchError,
      VendorExtendedAdminStockLocationResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/stock-locations/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: stockLocationsQueryKeys.detail(id, query),
    ...options,
  })
  
  return { ...data, ...rest }
}

export const useStockLocations = (
  query?: HttpTypes.AdminStockLocationListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStockLocationListResponse,
      FetchError,
      HttpTypes.AdminStockLocationListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
  filters?: { id?: string[] }
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/stock-locations", {
        method: "GET",
      }),
    queryKey: stockLocationsQueryKeys.list(query),
    ...options,
  })

  if (!filters) {
    return { ...data, ...rest }
  }

  const stock_locations = data?.stock_locations.filter((location) =>
    filters.id?.includes(location.id)
  )

  const count = stock_locations?.length || 0
  return { count, stock_locations, ...rest }
}

export const useCreateStockLocation = (
  options?: UseMutationOptions<
    HttpTypes.AdminStockLocationResponse,
    FetchError,
    HttpTypes.AdminCreateStockLocation
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/stock-locations", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data, variables, context) => {
      const { sales_channels } = await fetchQuery("/vendor/sales-channels", {
        method: "GET",
      })
      await fetchQuery(
        `/vendor/stock-locations/${data.stock_location.id}/sales-channels`,
        {
          method: "POST",
          body: { add: [sales_channels?.[0].id || null] },
        }
      )
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateStockLocation = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStockLocationResponse,
    FetchError,
    HttpTypes.AdminUpdateStockLocation
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/stock-locations/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.details(),
      })
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateStockLocationSalesChannels = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStockLocationResponse,
    FetchError,
    HttpTypes.AdminUpdateStockLocationSalesChannels
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/stock-locations/${id}/sales-channels`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.details(),
      })
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteStockLocation = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStockLocationDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/stock-locations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCreateStockLocationFulfillmentSet = (
  locationId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStockLocationResponse,
    FetchError,
    HttpTypes.AdminCreateStockLocationFulfillmentSet
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/stock-locations/${locationId}/fulfillment-sets`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateStockLocationFulfillmentProviders = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStockLocationResponse,
    FetchError,
    HttpTypes.AdminBatchLink
  >
) => {
  return useMutation({
    mutationFn: async (payload) =>
      await fetchQuery(`/vendor/stock-locations/${id}/fulfillment-providers`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.details(),
      })
      await queryClient.invalidateQueries({
        queryKey: fulfillmentProvidersQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
