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

const PRODUCT_TYPES_QUERY_KEY = "product_types" as const
export const productTypesQueryKeys = queryKeysFactory(PRODUCT_TYPES_QUERY_KEY)

export const useProductType = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.productTypes.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productTypes.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productTypes.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productTypes.$id.query({ $id: id, ...query }),
    queryKey: productTypesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductTypes = (
  query?: InferClientInput<typeof sdk.admin.productTypes.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productTypes.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productTypes.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productTypes.query({ ...query }),
    queryKey: productTypesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductType = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTypes.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.productTypes.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.productTypes.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productTypesQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTypes.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.productTypes.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productTypes.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: productTypesQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTypes.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productTypes.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: productTypesQueryKeys.lists() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
