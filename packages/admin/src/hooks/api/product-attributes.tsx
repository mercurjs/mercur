import { ClientError } from "@mercurjs/client"
import { HttpTypes } from "@mercurjs/types"
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

const PRODUCT_ATTRIBUTES_QUERY_KEY = "product_attributes" as const
export const productAttributesQueryKeys = queryKeysFactory(
  PRODUCT_ATTRIBUTES_QUERY_KEY
)

export const useProductAttribute = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductAttributeResponse,
      ClientError,
      HttpTypes.AdminProductAttributeResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productAttributesQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.admin.productAttributes.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductAttributes = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductAttributeListResponse,
      ClientError,
      HttpTypes.AdminProductAttributeListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productAttributesQueryKeys.list(query),
    queryFn: async () => sdk.admin.productAttributes.query({ ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductAttribute = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeResponse,
    ClientError,
    Record<string, any>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.productAttributes.mutate(payload as any),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductAttribute = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeResponse,
    ClientError,
    Record<string, any>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.productAttributes.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductAttribute = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeDeleteResponse,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.productAttributes.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpsertProductAttributeValues = (
  attributeId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeResponse,
    ClientError,
    Record<string, any>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.productAttributes.$id.values.mutate({
        $id: attributeId,
        ...payload,
      } as any),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.detail(attributeId),
      })
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductAttributeValue = (
  attributeId: string,
  valueId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeResponse,
    ClientError,
    Record<string, any>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.productAttributes.$id.values.$valueId.mutate({
        $id: attributeId,
        $valueId: valueId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.detail(attributeId),
      })
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductAttributeValue = (
  attributeId: string,
  valueId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductAttributeResponse,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.productAttributes.$id.values.$valueId.delete({
        $id: attributeId,
        $valueId: valueId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.detail(attributeId),
      })
      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
