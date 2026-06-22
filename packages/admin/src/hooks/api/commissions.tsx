import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const COMMISSIONS_QUERY_KEY = "commissions" as const;
export const commissionsQueryKeys = queryKeysFactory(COMMISSIONS_QUERY_KEY);

export const useCommissionRule = (
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
    queryFn: () => sdk.admin.commissionRates.$id.query({ $id: id, ...query }),
    queryKey: commissionsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCommissionRules = (
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
    queryKey: commissionsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

/**
 * The Global Commission — the single `is_default` rate (SPEC-011 contract).
 */
export const useDefaultCommission = (
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
    queryFn: () =>
      sdk.admin.commissionRates.query({ is_default: true, ...query }),
    queryKey: commissionsQueryKeys.list({ is_default: true, ...query }),
    ...options,
  });

  return { default_commission: data?.commission_rates?.[0], ...rest };
};

export const useCreateCommissionRule = (
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
        queryKey: commissionsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCommissionRule = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.commissionRates.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.commissionRates.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.commissionRates.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: commissionsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: commissionsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCommissionRule = (
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
        queryKey: commissionsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: commissionsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

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
        queryKey: commissionsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: commissionsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
