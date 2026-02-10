import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { stockLocationsQueryKeys } from "./stock-locations"

const SHIPPING_OPTIONS_QUERY_KEY = "shipping_options" as const
export const shippingOptionsQueryKeys = queryKeysFactory(
  SHIPPING_OPTIONS_QUERY_KEY
)

export const useShippingOption = (
  id: string,
  query?: Record<string, any>,
  options?: UseQueryOptions<
    HttpTypes.AdminShippingOptionResponse,
    Error,
    HttpTypes.AdminShippingOptionResponse,
    QueryKey
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/shipping-options/${id}`, {
        method: "GET",
        query,
      }),
    queryKey: shippingOptionsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useShippingOptions = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminShippingOptionListResponse,
      FetchError,
      HttpTypes.AdminShippingOptionListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/shipping-options", {
        method: "GET",
        query,
      }),
    queryKey: shippingOptionsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateShippingOptions = (
  options?: UseMutationOptions<
    HttpTypes.AdminShippingOptionResponse,
    FetchError,
    Partial<HttpTypes.AdminCreateShippingOption>
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/shipping-options", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateShippingOptions = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminShippingOptionResponse,
    FetchError,
    HttpTypes.AdminUpdateShippingOption
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      return fetchQuery(`/vendor/shipping-options/${id}`, {
        method: "POST",
        body: payload,
      })
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteShippingOption = (
  optionId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminShippingOptionDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/shipping-options/${optionId}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
