import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  AdminCommissionAggregate,
  AdminCommissionRule,
  AdminCreateCommissionRule,
  AdminUpsertDefaultCommissionRule,
} from "@mercurjs/http-client";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";

export const commissionRulesQueryKeys = queryKeysFactory("commission_rule");

export const useCommissionRules = (
  query?: Parameters<typeof api.admin.adminListCommissionRules>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminListCommissionRules>[0],
      Error,
      { commission_rules: AdminCommissionAggregate[]; count?: number },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.list(query),
    queryFn: () =>
      api.admin.adminListCommissionRules(query).then((res) => res.data),
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
      api.admin.adminGetDefaultCommissionRule().then((res) => res.data),
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
      { commission_rule?: AdminCommissionAggregate },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.detail(id),
    queryFn: () =>
      api.admin.adminGetCommissionRuleById(id).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};

export const useCreateCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: AdminCommissionRule },
    Error,
    AdminCreateCommissionRule
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.admin.adminCreateCommissionRule(payload).then((res) => res.data),
    ...options,
  });
};

export const useUpdateCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: AdminCommissionRule },
    Error,
    { id: string; is_active: boolean }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.admin
        .adminUpdateCommissionRuleById(payload.id, {
          is_active: payload.is_active,
        })
        .then((res) => res.data),
    ...options,
  });
};

export const useUpsertDefaultCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: AdminCommissionRule },
    Error,
    AdminUpsertDefaultCommissionRule
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.admin
        .adminUpsertDefaultCommissionRule(payload)
        .then((res) => res.data),
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
      api.admin
        .adminDeleteCommissionRuleById(payload.id)
        .then((res) => res.data),
    ...options,
  });
};
