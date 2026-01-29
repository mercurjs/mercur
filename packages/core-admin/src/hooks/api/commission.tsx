import { sdk } from "@lib/client";
import { queryKeysFactory } from "@lib/query-key-factory";
import type {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { CommissionLine } from "@custom-types/commission";

import type {
  AdminCommissionAggregate,
  CommissionRule,
  CreateCommissionRule,
  UpdateCommissionRule,
  UpsertDefaultCommissionRule,
} from "@/types/commission";

export const commissionRulesQueryKeys = queryKeysFactory("commission_rule");
export const useCommissionRules = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { commission_rules: AdminCommissionAggregate[]; count?: number },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery<
    Record<string, string | number>,
    Error,
    { commission_rules: AdminCommissionAggregate[]; count?: number }
  >({
    queryKey: commissionRulesQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/commission/rules", {
        method: "GET",
        query,
      }),
    ...options,
  });

  return { ...data, ...other };
};

export const useDefaultCommissionRule = (
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { commission_rule?: AdminCommissionAggregate },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.detail(""),
    queryFn: () =>
      sdk.client.fetch("/admin/commission/default", {
        method: "GET",
      }),
    ...options,
  });

  return { ...data, ...other };
};

export const useCommissionRule = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { commission_rule?: CommissionRule },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/commission/rules/${id}`, {
        method: "GET",
      }),
    ...options,
  });

  return { ...data, ...other };
};

export const useCreateCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: CommissionRule },
    Error,
    CreateCommissionRule
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch("/admin/commission/rules", {
        method: "POST",
        body: payload,
      }),
    ...options,
  });
};

export const useUpdateCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: CommissionRule },
    Error,
    { id: string } & UpdateCommissionRule
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch(`/admin/commission/rules/${payload.id}`, {
        method: "POST",
        body: { is_active: payload.is_active },
      }),
    ...options,
  });
};

export const useUpsertDefaultCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: CommissionRule },
    Error,
    UpsertDefaultCommissionRule
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch("/admin/commission/default", {
        method: "POST",
        body: payload,
      }),
    ...options,
  });
};

export const useDeleteCommisionRule = (
  options: UseMutationOptions<
    {
      id?: string;
      object?: string;
      deleted?: boolean;
    },
    Error,
    { id: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch(`/admin/commission/rules/${payload.id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

export const useListCommissionLines = (
  query?: Record<string, string | number>,
) => {
  return useQuery<
    {
      commission_lines: CommissionLine[];
      count: number;
    },
    Error
  >({
    queryKey: ["commission-lines", query],
    queryFn: () =>
      sdk.client.fetch(`/admin/commission/commission-lines`, {
        method: "GET",
        query,
      }),
  });
};
