import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueries,
} from "@tanstack/react-query"

import { fetchQuery, sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { variantsQueryKeys } from "./products"
import type {
  InventoryItemLocationLevel,
  InventoryItemWithLevels,
  UseMultipleInventoryItemLevelsReturn,
} from "../../types/inventory"

const INVENTORY_ITEMS_QUERY_KEY = "inventory_items" as const
export const inventoryItemsQueryKeys = queryKeysFactory(
  INVENTORY_ITEMS_QUERY_KEY
)

const INVENTORY_ITEM_LEVELS_QUERY_KEY = "inventory_item_levels" as const
export const inventoryItemLevelsQueryKeys = queryKeysFactory(
  INVENTORY_ITEM_LEVELS_QUERY_KEY
)

export const useInventoryItems = (
  query?: HttpTypes.AdminInventoryItemParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminInventoryItemListResponse,
      FetchError,
      HttpTypes.AdminInventoryItemListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
  filters?: { id: string[] }
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/inventory-items", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: inventoryItemsQueryKeys.list(query),
    ...options,
  })

  if (!filters) {
    return { ...data, ...rest }
  }

  const inventory_items = data?.inventory_items?.filter((item) =>
    filters.id.includes(item.id)
  )

  const count = inventory_items?.length || 0

  return { inventory_items, count, ...rest }
}

export const useInventoryItem = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminInventoryItemResponse,
      FetchError,
      HttpTypes.AdminInventoryItemResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/inventory-items/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: inventoryItemsQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateInventoryItem = (
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryItemResponse,
    FetchError,
    HttpTypes.AdminCreateInventoryItem
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateInventoryItem) =>
      sdk.admin.inventoryItem.create(payload),
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
    HttpTypes.AdminInventoryItemResponse,
    FetchError,
    HttpTypes.AdminUpdateInventoryItem
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateInventoryItem) =>
      fetchQuery(`/vendor/inventory-items/${id}`, {
        method: "POST",
        body: payload,
      }),
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
    HttpTypes.AdminInventoryItemDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn:  () =>
      fetchQuery(`/vendor/inventory-items/${id}`, {
        method: "DELETE",
      }),
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
    HttpTypes.AdminInventoryLevelDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId}/location-levels/${locationId}`,
        { method: "DELETE" }
      ),
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
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminInventoryLevelListResponse,
      FetchError,
      HttpTypes.AdminInventoryLevelListResponse & {
        location_levels: any[]
      },
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId!}/location-levels`,
        {
          method: "GET",
          query: query as {
            [key: string]: string | number
          },
        }
      ),
    queryKey: inventoryItemLevelsQueryKeys.detail(inventoryItemId),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateInventoryLevel = (
  inventoryItemId: string,
  locationId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryItemResponse,
    FetchError,
    HttpTypes.AdminUpdateInventoryLevel
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateInventoryLevel) =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId}/location-levels/${locationId}`,
        { method: "POST", body: payload }
      ),
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

export const useBatchInventoryItemLocationLevels = (
  inventoryItemId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchInventoryItemLocationLevelsResponse,
    FetchError,
    HttpTypes.AdminBatchInventoryItemLocationLevels
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId}/location-levels/batch`,
        {
          method: "POST",
          body: payload,
        }
      ),
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

export const useBatchInventoryItemsLocationLevels = (
  options?: UseMutationOptions<
    HttpTypes.AdminBatchInventoryItemsLocationLevelsResponse,
    FetchError,
    HttpTypes.AdminBatchInventoryItemsLocationLevels
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/inventory-items/location-levels/batch", {
        method: "POST",
        body: payload,
      }),
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

// TODO: Change this to use endpoint that returns location levels for specific inventory items insted of mapping inventory items to location levels
export const useMultipleInventoryItemLevels = (
  inventoryItemIds: string[],
  query?: Record<string, any>
): UseMultipleInventoryItemLevelsReturn => {
  const queries = useQueries({
    queries: inventoryItemIds.map((id) => ({
      queryKey: inventoryItemLevelsQueryKeys.detail(id, query),
      queryFn: () =>
        fetchQuery(`/vendor/inventory-items/${id}/location-levels`, {
          method: "GET",
          query: { fields: "*stock_locations", ...query } as {
            [key: string]: string | number
          },
        }),
      enabled: Boolean(id),
    })),
  })

  const isPending = queries.some((q) => q.isPending)
  const isRefetching = queries.some((q) => q.isRefetching)
  const isError = queries.some((q) => q.isError)
  const error = queries.find((q) => q.error)?.error

  const allLocationLevels: InventoryItemLocationLevel[] = queries
    .filter((q) => q.data?.location_levels)
    .flatMap((q) => q.data?.location_levels || [])

  const inventoryItemsWithLevels: InventoryItemWithLevels[] = queries
    .map((query, index) => {
      if (query.data?.location_levels) {
        return {
          inventory_item_id: inventoryItemIds[index],
          location_levels: query.data
            .location_levels as InventoryItemLocationLevel[],
        }
      }
      return null
    })
    .filter((item): item is InventoryItemWithLevels => item !== null)

  const refetch = async () => {
    await Promise.all(queries.map((q) => q.refetch()))
  }

  return {
    inventoryItemsWithLevels,
    allLocationLevels,
    isPending,
    isRefetching,
    isError,
    error,
    refetch,
  }
}
