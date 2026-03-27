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

const ATTRIBUTES_QUERY_KEY = "attributes" as const
export const attributesQueryKeys = queryKeysFactory(ATTRIBUTES_QUERY_KEY)

export const useAttribute = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.attributes.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.attributes.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.attributes.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributesQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.attributes.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useAttributes = (
  query?: InferClientInput<typeof sdk.admin.attributes.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.attributes.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.attributes.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributesQueryKeys.list(query),
    queryFn: () => sdk.admin.attributes.query({ ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateAttribute = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.attributes.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.attributes.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.attributes.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateAttribute = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.attributes.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.attributes.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.attributes.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteAttribute = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.attributes.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.attributes.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateAttributePossibleValue = (
  attributeId: string,
  valueId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.attributes.$id.values.$valueId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.attributes.$id.values.$valueId.mutate>,
      "$id" | "$valueId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.attributes.$id.values.$valueId.mutate({
        $id: attributeId,
        $valueId: valueId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.detail(attributeId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
