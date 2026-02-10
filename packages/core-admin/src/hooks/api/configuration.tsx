import { sdk } from "@lib/client";
import { queryKeysFactory } from "@lib/query-key-factory";
import {
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import type {
  AdminCreateRule,
  ConfigurationRule,
} from "@custom-types/configuration";

export const configurationQueryKeys = queryKeysFactory("configuration_rules");

export const useConfigurationRules = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { configuration_rules: ConfigurationRule[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery<
    Record<string, string | number>,
    Error,
    { configuration_rules: ConfigurationRule[] }
  >({
    queryKey: configurationQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/configuration", {
        method: "GET",
        query,
      }),
    ...options,
  });

  return { ...data, ...other };
};

export const useCreateConfigurationRule = (
  options: UseMutationOptions<
    { configuration_rule?: ConfigurationRule },
    Error,
    AdminCreateRule
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch("/admin/configuration", {
        method: "POST",
        body: payload,
      }),
    ...options,
  });
};

export const useUpdateConfigurationRule = (
  options: UseMutationOptions<
    { configuration_rule?: ConfigurationRule },
    Error,
    { id: string; is_enabled: boolean }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, is_enabled }) =>
      sdk.client.fetch(`/admin/configuration/${id}`, {
        method: "POST",
        body: { is_enabled },
      }),
    ...options,
  });
};
