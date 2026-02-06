import {
  QueryKey,
  UseInfiniteQueryOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { InfiniteData } from "@tanstack/query-core"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { ClientError } from "@mercurjs/client"
import { HttpTypes } from "@medusajs/types"
import { useInfiniteList } from "../use-infinite-list"

const PRODUCT_VARIANT_QUERY_KEY = "product_variant" as const
export const productVariantQueryKeys = queryKeysFactory(
  PRODUCT_VARIANT_QUERY_KEY
)

export const useVariants = (
  query?: HttpTypes.AdminProductVariantParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantListResponse,
      ClientError,
      HttpTypes.AdminProductVariantListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productVariant.list(query),
    queryKey: productVariantQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useInfiniteVariants = (
  query?: Omit<HttpTypes.AdminProductVariantParams, "offset" | "limit"> & {
    limit?: number
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      HttpTypes.AdminProductVariantListResponse,
      ClientError,
      InfiniteData<HttpTypes.AdminProductVariantListResponse, number>,
      HttpTypes.AdminProductVariantListResponse,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList<
    HttpTypes.AdminProductVariantListResponse,
    HttpTypes.AdminProductVariantParams,
    ClientError,
    QueryKey
  >({
    queryKey: (params) => productVariantQueryKeys.list(params),
    queryFn: async (params) => {
      return await sdk.admin.productVariant.list(params)
    },
    query,
    options,
  })
}
