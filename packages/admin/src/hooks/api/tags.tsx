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

const TAGS_QUERY_KEY = "tags" as const
export const productTagsQueryKeys = queryKeysFactory(TAGS_QUERY_KEY)

export const useProductTag = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.productTags.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productTags.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productTags.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productTagsQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.productTags.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductTags = (
  query?: InferClientInput<typeof sdk.admin.productTags.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.productTags.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.productTags.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: () => sdk.admin.productTags.query({ ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateProductTag = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTags.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.productTags.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.productTags.mutate(payload),
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
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTags.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.productTags.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productTags.$id.mutate({ $id: id, ...payload }),
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

export const useDeleteProductTag = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTags.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productTags.$id.delete({ $id: id }),
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
