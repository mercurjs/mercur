import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
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
import { customerGroupsQueryKeys } from "./customer-groups"
import { productsQueryKeys } from "./products"

const PRICE_LISTS_QUERY_KEY = "price-lists" as const
export const priceListsQueryKeys = queryKeysFactory(PRICE_LISTS_QUERY_KEY)

export const usePriceList = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.priceLists.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.priceLists.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.priceLists.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.priceLists.$id.query({ $id: id, ...query }),
    queryKey: priceListsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const usePriceLists = (
  query?: InferClientInput<typeof sdk.admin.priceLists.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.priceLists.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.priceLists.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.priceLists.query({ ...query }),
    queryKey: priceListsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreatePriceList = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.priceLists.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.priceLists.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.priceLists.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() })

      queryClient.invalidateQueries({ queryKey: customerGroupsQueryKeys.all })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdatePriceList = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.priceLists.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.priceLists.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.priceLists.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.details(),
      })

      queryClient.invalidateQueries({ queryKey: customerGroupsQueryKeys.all })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeletePriceList = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.priceLists.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.priceLists.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchPriceListPrices = (
  id: string,
  query?: Record<string, any>,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.priceLists.$id.prices.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.priceLists.$id.prices.batch.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.priceLists.$id.prices.batch.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const usePriceListLinkProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.priceLists.$id.products.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.priceLists.$id.products.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.priceLists.$id.products.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
