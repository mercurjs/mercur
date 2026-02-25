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
import { productsQueryKeys } from "./products"

const CATEGORIES_QUERY_KEY = "categories" as const
export const categoriesQueryKeys = queryKeysFactory(CATEGORIES_QUERY_KEY)

export const useProductCategory = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.productCategories.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productCategories.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productCategories.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: categoriesQueryKeys.detail(id, query),
    queryFn: () =>
      sdk.admin.productCategories.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductCategories = (
  query?: InferClientInput<typeof sdk.admin.productCategories.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productCategories.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productCategories.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: categoriesQueryKeys.list(query),
    queryFn: () => sdk.admin.productCategories.query({ ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductCategory = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productCategories.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.productCategories.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.productCategories.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductCategory = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productCategories.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.productCategories.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productCategories.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductCategory = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productCategories.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productCategories.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductCategoryProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productCategories.$id.products.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.productCategories.$id.products.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productCategories.$id.products.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.details(),
      })
      /**
       * Invalidate products list query to ensure that the products collections are updated.
       */
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
