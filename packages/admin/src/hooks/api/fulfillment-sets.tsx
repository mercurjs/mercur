import { ClientError } from "@mercurjs/client"
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
import { shippingOptionsQueryKeys } from "./shipping-options"
import { stockLocationsQueryKeys } from "./stock-locations"

const FULFILLMENT_SETS_QUERY_KEY = "fulfillment_sets" as const
export const fulfillmentSetsQueryKeys = queryKeysFactory(
  FULFILLMENT_SETS_QUERY_KEY
)

export const useDeleteFulfillmentSet = (
  id: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminFulfillmentSetDeleteResponse,
      ClientError,
      void
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.fulfillmentSets.$id.delete({ $id: id }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.detail(id),
      })
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      })

      // We need to invalidate all related entities. We invalidate using `all` keys to ensure that all relevant entities are invalidated.
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })
      await queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  query?: HttpTypes.SelectParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminServiceZoneResponse,
      ClientError,
      HttpTypes.AdminServiceZoneResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.fulfillmentSets.$id.serviceZones.$id.query({
        $id: serviceZoneId,
        ...query,
      }),
    queryKey: fulfillmentSetsQueryKeys.detail(fulfillmentSetId, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminFulfillmentSetResponse,
      ClientError,
      HttpTypes.AdminCreateFulfillmentSetServiceZone,
      QueryKey
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.fulfillmentSets.$id.serviceZones.mutate({
        $id: fulfillmentSetId,
        ...payload,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminFulfillmentSetResponse,
      ClientError,
      HttpTypes.AdminUpdateFulfillmentSetServiceZone,
      QueryKey
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.fulfillmentSets.$id.serviceZones.$id.mutate({
        $id: serviceZoneId,
        ...payload,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteFulfillmentServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminServiceZoneDeleteResponse,
      ClientError,
      void
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.fulfillmentSets.$id.serviceZones.$id.delete({
        $id: serviceZoneId,
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.lists(),
      })
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
