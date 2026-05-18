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

const PRODUCT_BRANDS_QUERY_KEY = "product_brands" as const
export const productBrandsQueryKeys = queryKeysFactory(PRODUCT_BRANDS_QUERY_KEY)

export const useProductBrand = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.productBrands.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productBrands.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productBrands.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productBrands.$id.query({ $id: id, ...query }),
    queryKey: productBrandsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductBrands = (
  query?: InferClientInput<typeof sdk.admin.productBrands.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productBrands.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productBrands.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productBrands.query({ ...query }),
    queryKey: productBrandsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductBrand = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productBrands.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.productBrands.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.productBrands.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productBrandsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductBrand = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productBrands.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.productBrands.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productBrands.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productBrandsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: productBrandsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductBrand = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productBrands.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productBrands.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productBrandsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: productBrandsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
