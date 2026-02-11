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

import { sdk, fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { variantsQueryKeys } from "./products"

const INVENTORY_ITEMS_QUERY_KEY = "inventory_items" as const
export const inventoryItemsQueryKeys = queryKeysFactory(
  INVENTORY_ITEMS_QUERY_KEY
)

const INVENTORY_ITEM_LEVELS_QUERY_KEY = "inventory_item_levels" as const
export const inventoryItemLevelsQueryKeys = queryKeysFactory(
  INVENTORY_ITEM_LEVELS_QUERY_KEY
)

export const useInventoryItems = (
  query?: InferClientInput<typeof sdk.vendor.inventoryItems.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.inventoryItems.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.inventoryItems.query({ ...query }),
    queryKey: inventoryItemsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useInventoryItem = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.inventoryItems.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.inventoryItems.$id.query({ id, ...query }),
    queryKey: inventoryItemsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateInventoryItem = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.inventoryItems.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.inventoryItems.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateInventoryItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.inventoryItems.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.inventoryItems.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteInventoryItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.inventoryItems.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteInventoryItemLevel = (
  inventoryItemId: string,
  locationId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.locationLevels.$locationId.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.inventoryItems.$id.locationLevels.$locationId.delete({
        id: inventoryItemId,
        locationId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(inventoryItemId),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.detail(inventoryItemId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useInventoryItemLevels = (
  inventoryItemId: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.inventoryItems.$id.locationLevels.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.locationLevels.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => {
      if (!inventoryItemId) {
        throw new Error("inventoryItemId is required for useInventoryItemLevels")
      }
      return fetchQuery(`/vendor/inventory-items/${inventoryItemId}/location-levels`, {
        method: "GET",
        query: { ...query },
      })
    },
    queryKey: inventoryItemLevelsQueryKeys.list({
      ...(query || {}),
      inventoryItemId,
    }),
    ...options,
    enabled: !!inventoryItemId && (options?.enabled !== undefined ? options.enabled : true),
  })

  return { ...data, ...rest }
}

export const useUpdateInventoryLevel = (
  inventoryItemId: string,
  locationId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.locationLevels.$locationId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.inventoryItems.$id.locationLevels.$locationId.mutate>,
      "id" | "locationId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.inventoryItems.$id.locationLevels.$locationId.mutate({
        id: inventoryItemId,
        locationId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(inventoryItemId),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.detail(inventoryItemId),
      })
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.details(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchInventoryItemLocationLevels = (
  inventoryItemId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.$id.locationLevels.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.inventoryItems.$id.locationLevels.batch.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.inventoryItems.$id.locationLevels.batch.mutate({
        id: inventoryItemId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(inventoryItemId),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.detail(inventoryItemId),
      })
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.list({ inventoryItemId }),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchInventoryItemsLocationLevels = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.inventoryItems.locationLevels.batch.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.inventoryItems.locationLevels.batch.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.inventoryItems.locationLevels.batch.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
