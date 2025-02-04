import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { AdminCreateRule, ConfigurationRule } from '@mercurjs/http-client'

import { api } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const configurationQueryKeys = queryKeysFactory('configuration_rules')

export const useConfigurationRules = (
  query?: Parameters<typeof api.admin.adminListRules>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminListRules>[0],
      Error,
      { configuration_rules: ConfigurationRule[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: configurationQueryKeys.list(query),
    queryFn: () => api.admin.adminListRules(query).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}

export const useCreateConfigurationRule = (
  options: UseMutationOptions<
    { configuration_rule?: ConfigurationRule },
    Error,
    AdminCreateRule
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.admin.adminCreateRule(payload).then((res) => res.data),
    ...options
  })
}

export const useUpdateConfigurationRule = (
  options: UseMutationOptions<
    { configuration_rule?: ConfigurationRule },
    Error,
    { id: string; is_enabled: boolean }
  >
) => {
  return useMutation({
    mutationFn: ({ id, is_enabled }) =>
      api.admin.adminUpdateRule(id, { is_enabled }).then((res) => res.data),
    ...options
  })
}
