import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery, sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const TAGS_QUERY_KEY = "tags" as const
export const productTagsQueryKeys = queryKeysFactory(TAGS_QUERY_KEY)

export const useProductTag = (
  id: string,
  query?: HttpTypes.AdminProductTagParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductTagResponse,
      FetchError,
      HttpTypes.AdminProductTagResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productTagsQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(`/vendor/product-tags/${id}`, {
        method: "GET",
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductTags = (
  query?: HttpTypes.AdminProductTagListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductTagListResponse,
      FetchError,
      HttpTypes.AdminProductTagListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: async () =>
      fetchQuery("/vendor/product-tags", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductTag = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductTagResponse,
    FetchError,
    HttpTypes.AdminCreateProductTag
  >
) => {
  return useMutation({
    mutationFn: async (body) =>
      fetchQuery("/vendor/product-tags", {
        method: "POST",
        body,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductTag = (
  id: string,
  query?: HttpTypes.AdminProductTagParams,
  options?: UseMutationOptions<
    HttpTypes.AdminProductTagResponse,
    FetchError,
    HttpTypes.AdminUpdateProductTag
  >
) => {
  return useMutation({
    mutationFn: async (data) => sdk.admin.productTag.update(id, data, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(data.product_tag.id, query),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductTag = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductTagDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: async () => sdk.admin.productTag.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
