import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { taxRegionsQueryKeys } from "./tax-regions";

const TAX_RATES_QUERY_KEY = "tax_rates" as const;
export const taxRatesQueryKeys = queryKeysFactory(TAX_RATES_QUERY_KEY);

export const useTaxRate = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.taxRates.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.taxRates.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: taxRatesQueryKeys.detail(id),
    queryFn: async () => sdk.admin.taxRates.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useTaxRates = (
  query?: InferClientInput<typeof sdk.admin.taxRates.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.taxRates.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.taxRates.query({ ...query }),
    queryKey: taxRatesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateTaxRate = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRates.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.taxRates.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.taxRates.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taxRatesQueryKeys.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: taxRegionsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

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
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() });

      queryClient.invalidateQueries({
        queryKey: taxRegionsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteTaxRate = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.taxRates.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.taxRates.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: taxRatesQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taxRatesQueryKeys.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: taxRegionsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
