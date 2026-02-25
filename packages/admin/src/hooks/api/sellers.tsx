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

const SELLERS_QUERY_KEY = "sellers" as const
export const sellersQueryKeys = queryKeysFactory(SELLERS_QUERY_KEY)

export const useSeller = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.sellers.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.sellers.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.sellers.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.sellers.$id.query({ $id: id, ...query }),
    queryKey: sellersQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useSellers = (
  query?: InferClientInput<typeof sdk.admin.sellers.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.sellers.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.sellers.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.sellers.query({ ...query }),
    queryKey: sellersQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.sellers.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
