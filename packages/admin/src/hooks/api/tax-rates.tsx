import type { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import type {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions} from "@tanstack/react-query";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { taxRegionsQueryKeys } from "./tax-regions"
import type { ExtendedAdminTaxRateResponse } from "@custom-types/tax-rates"
import { queryKeysFactory } from "@lib/query-key-factory";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";

const TAX_RATES_QUERY_KEY = "tax_rates" as const
export const taxRatesQueryKeys = queryKeysFactory(TAX_RATES_QUERY_KEY)

export const useTaxRate = (
  id: string,
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<
      ExtendedAdminTaxRateResponse,
      ClientError,
      ExtendedAdminTaxRateResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: taxRatesQueryKeys.detail(id),
    queryFn: async () => sdk.admin.taxRates.$id.query({ $id: id, ...query }) as Promise<ExtendedAdminTaxRateResponse>,
    ...options,
  })

  return { ...data, ...rest }
}

export const useTaxRates = (
  query?: InferClientInput<typeof sdk.admin.taxRates.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.taxRates.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.taxRates.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.taxRates.query({ ...query }),
    queryKey: taxRatesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateTaxRate = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRates.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.taxRates.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.taxRates.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: taxRatesQueryKeys.detail(id),
      })

      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.details() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCreateTaxRate = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRates.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.taxRates.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.taxRates.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() })

      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.details() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteTaxRate = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRates.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.taxRates.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: taxRatesQueryKeys.detail(id),
      })

      queryClient.invalidateQueries({ queryKey: taxRegionsQueryKeys.details() })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
