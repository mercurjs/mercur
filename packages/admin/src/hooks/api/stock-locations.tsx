import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
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
import { fulfillmentProvidersQueryKeys } from "./fulfillment-providers"

const STOCK_LOCATIONS_QUERY_KEY = "stock_locations" as const
export const stockLocationsQueryKeys = queryKeysFactory(
  STOCK_LOCATIONS_QUERY_KEY
)

export const useStockLocation = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.stockLocations.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.stockLocations.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.stockLocations.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.stockLocations.$id.query({ $id: id, ...query }),
    queryKey: stockLocationsQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useStockLocations = (
  query?: InferClientInput<typeof sdk.admin.stockLocations.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.stockLocations.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.stockLocations.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.stockLocations.query({ ...query }),
    queryKey: stockLocationsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateStockLocation = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.stockLocations.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.stockLocations.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.stockLocations.mutate(payload),
    onSuccess: async (data, variables, context) => {
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
    InferClientOutput<typeof sdk.admin.stockLocations.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.stockLocations.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.stockLocations.$id.mutate({ $id: id, ...payload }),
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
    InferClientOutput<typeof sdk.admin.stockLocations.$id.salesChannels.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.stockLocations.$id.salesChannels.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.stockLocations.$id.salesChannels.mutate({
        $id: id,
        ...payload,
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
    InferClientOutput<typeof sdk.admin.stockLocations.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.stockLocations.$id.delete({ $id: id }),
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
    InferClientOutput<
      typeof sdk.admin.stockLocations.$id.fulfillmentSets.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.stockLocations.$id.fulfillmentSets.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.stockLocations.$id.fulfillmentSets.mutate({
        $id: locationId,
        ...payload,
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
    InferClientOutput<
      typeof sdk.admin.stockLocations.$id.fulfillmentProviders.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.stockLocations.$id.fulfillmentProviders.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: async (payload) =>
      await sdk.admin.stockLocations.$id.fulfillmentProviders.mutate({
        $id: id,
        ...payload,
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
