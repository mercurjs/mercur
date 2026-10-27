import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const SHIPPING_RULES_QUERY_KEY = "shipping_rules" as const
export const shippingRulesQueryKeys = queryKeysFactory(
  SHIPPING_RULES_QUERY_KEY
)

const invalidateShippingRules = () =>
  queryClient.invalidateQueries({ queryKey: shippingRulesQueryKeys.all })

export const useShippingRule = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.shippingRules.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingRules.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingRules.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.shippingRules.$id.query({ $id: id, ...query }),
    queryKey: shippingRulesQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useShippingRules = (
  query?: Partial<InferClientInput<typeof sdk.admin.shippingRules.query>>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.shippingRules.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.shippingRules.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.shippingRules.query(
        { ...query } as InferClientInput<typeof sdk.admin.shippingRules.query>
      ),
    queryKey: shippingRulesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateShippingRule = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingRules.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.shippingRules.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingRules.mutate(payload),
    onSuccess: (data, variables, context) => {
      invalidateShippingRules()

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateShippingRule = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingRules.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.shippingRules.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.shippingRules.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      invalidateShippingRules()

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteShippingRule = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingRules.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.shippingRules.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      invalidateShippingRules()

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchShippingRules = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.shippingRules.batch.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.shippingRules.batch.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingRules.batch.mutate(payload),
    onSuccess: (data, variables, context) => {
      invalidateShippingRules()

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
