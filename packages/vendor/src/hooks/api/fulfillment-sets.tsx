import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
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
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillmentSets.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.fulfillmentSets.$id.delete({ id }),
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
  query?: Omit<
    InferClientInput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.query>,
    "id" | "zoneId"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.query({
        id: fulfillmentSetId,
        zoneId: serviceZoneId,
        ...query,
      }),
    queryKey: fulfillmentSetsQueryKeys.detail(fulfillmentSetId, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.fulfillmentSets.$id.serviceZones.mutate({
        id: fulfillmentSetId,
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
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.mutate>,
      "id" | "zoneId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.mutate({
        id: fulfillmentSetId,
        zoneId: serviceZoneId,
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
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.fulfillmentSets.$id.serviceZones.$zoneId.delete({
        id: fulfillmentSetId,
        zoneId: serviceZoneId,
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
