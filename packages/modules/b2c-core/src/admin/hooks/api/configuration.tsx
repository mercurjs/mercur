import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'
import {
  AdminCreateRule,
  ConfigurationRule
} from '../../routes/configuration/types'

export const configurationQueryKeys = queryKeysFactory('configuration_rules')

export const useConfigurationRules = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { configuration_rules: ConfigurationRule[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: configurationQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/configuration', {
        method: 'GET',
        query
      }),
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
      mercurQuery('/admin/configuration', {
        method: 'POST',
        body: payload
      }),
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
      mercurQuery(`/admin/configuration/${id}`, {
        method: 'POST',
        body: { is_enabled }
      }),
    ...options
  })
}
