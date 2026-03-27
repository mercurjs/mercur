import { ClientError } from "@mercurjs/client"
import {
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
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { attribute: Record<string, any> },
      ClientError
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributesQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.admin.attributes.$id.query({ $id: id, ...query }) as Promise<{
        attribute: Record<string, any>
      }>,
    ...options,
  })

  return { ...data, ...rest }
}

export const useAttributes = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { attributes: Record<string, any>[]; count: number },
      ClientError
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributesQueryKeys.list(query),
    queryFn: async () =>
      sdk.admin.attributes.query({ ...query }) as Promise<{
        attributes: Record<string, any>[]
        count: number
      }>,
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateAttribute = (
  options?: UseMutationOptions<any, ClientError, Record<string, any>>
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      sdk.admin.attributes.mutate(payload as any),
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
  options?: UseMutationOptions<any, ClientError, Record<string, any>>
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
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
  options?: UseMutationOptions<any, ClientError, void>
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
  options?: UseMutationOptions<any, ClientError, Record<string, any>>
) => {
  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
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
