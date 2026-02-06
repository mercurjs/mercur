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
import convertShippingProfileNames from "../../lib/convert-shipping-profile-names"

const SHIPPING_PROFILE_QUERY_KEY = "shipping_profile" as const
export const shippingProfileQueryKeys = queryKeysFactory(
  SHIPPING_PROFILE_QUERY_KEY
)

export const useCreateShippingProfile = (
  options?: UseMutationOptions<
    HttpTypes.AdminShippingProfileResponse,
    FetchError,
    HttpTypes.AdminCreateShippingProfile
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/shipping-profiles", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useShippingProfile = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminShippingProfileResponse,
      FetchError,
      HttpTypes.AdminShippingProfileResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/shipping-profiles/${id}`, {
        method: "GET",
        query,
      }),
    queryKey: shippingProfileQueryKeys.detail(id, query),
    ...options,
  })

  const shipping_profile = data?.shipping_profile
    ? {
        ...data.shipping_profile,
        name: data.shipping_profile.name?.includes(":")
          ? data.shipping_profile.name.split(":")[1]
          : data.shipping_profile.name,
      }
    : undefined

  return {
    shipping_profile,
    ...rest,
  }
}

export const useShippingProfiles = (
  query?: HttpTypes.AdminShippingProfileListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminShippingProfileListResponse,
      FetchError,
      HttpTypes.AdminShippingProfileListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/shipping-profiles", {
        method: "GET",
      }),
    queryKey: shippingProfileQueryKeys.list(query),
    ...options,
  })

  const shipping_profiles = data?.shipping_profiles
    ?.map((sp) => {
      const profile = (sp as any).shipping_profile || sp
      return convertShippingProfileNames(profile)
    })
    .filter(Boolean)

  return { ...data, shipping_profiles, ...rest }
}

export const useUpdateShippingProfile = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminShippingProfileResponse,
    FetchError,
    HttpTypes.AdminUpdateShippingProfile
  >
) => {
  const { data, ...rest } = useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/shipping-profiles/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

  return { ...data, ...rest }
}

export const useDeleteShippingProfile = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminShippingProfileDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/shipping-profiles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
