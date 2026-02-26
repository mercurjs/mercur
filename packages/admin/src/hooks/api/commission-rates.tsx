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

const COMMISSION_RATES_QUERY_KEY = "commission_rates" as const
export const commissionRatesQueryKeys = queryKeysFactory(
  COMMISSION_RATES_QUERY_KEY
)

export const useCommissionRate = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.commissionRates.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.commissionRates.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.commissionRates.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.commissionRates.$id.query({ $id: id, ...query }),
    queryKey: commissionRatesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCommissionRates = (
  query?: InferClientInput<typeof sdk.admin.commissionRates.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.commissionRates.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.commissionRates.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.commissionRates.query({ ...query }),
    queryKey: commissionRatesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateCommissionRate = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.commissionRates.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.commissionRates.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.commissionRates.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateCommissionRate = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.commissionRates.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.commissionRates.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.commissionRates.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCommissionRate = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.commissionRates.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.commissionRates.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchCommissionRules = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.commissionRates.$id.rules.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.commissionRates.$id.rules.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.commissionRates.$id.rules.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: commissionRatesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
