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

const PRODUCT_REJECTION_REASONS_QUERY_KEY =
  "product_rejection_reasons" as const
export const productRejectionReasonsQueryKeys = queryKeysFactory(
  PRODUCT_REJECTION_REASONS_QUERY_KEY
)

export const useProductRejectionReason = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductRejectionReasonResponse,
      ClientError,
      HttpTypes.AdminProductRejectionReasonResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productRejectionReasonsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.admin.productRejectionReasons.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductRejectionReasons = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductRejectionReasonListResponse,
      ClientError,
      HttpTypes.AdminProductRejectionReasonListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productRejectionReasonsQueryKeys.list(query),
    queryFn: async () =>
      sdk.admin.productRejectionReasons.query({ ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductRejectionReason = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductRejectionReasonResponse,
    ClientError,
    Record<string, any>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.productRejectionReasons.mutate(payload as any),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productRejectionReasonsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateProductRejectionReason = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductRejectionReasonResponse,
    ClientError,
    Record<string, any>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.productRejectionReasons.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productRejectionReasonsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productRejectionReasonsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteProductRejectionReason = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductRejectionReasonDeleteResponse,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.productRejectionReasons.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productRejectionReasonsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: productRejectionReasonsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
