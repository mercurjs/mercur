import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'
import { CommissionLine } from '../../routes/commission-lines/types'
import {
  CommissionRule,
  CreateCommissionRule,
  UpdateCommissionRule,
  UpsertDefaultCommissionRule
} from '../../routes/commission/types'

export const commissionRulesQueryKeys = queryKeysFactory('commission_rule')

export const useCommissionRules = (
  query?: any,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { commission_rules: CommissionRule[]; count?: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/commission/rules', {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useDefaultCommissionRule = (
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { commission_rule?: CommissionRule },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.detail(''),
    queryFn: () =>
      mercurQuery('/admin/commission/default', {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useCommissionRule = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { commission_rule?: CommissionRule },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: commissionRulesQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/commission/rules/${id}`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useCreateCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: CommissionRule },
    Error,
    CreateCommissionRule
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      mercurQuery('/admin/commission/rules', {
        method: 'POST',
        body: payload
      }),
    ...options
  })
}

export const useUpdateCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: CommissionRule },
    Error,
    { id: string } & UpdateCommissionRule
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      mercurQuery(`/admin/commission/rules/${payload.id}`, {
        method: 'POST',
        body: { is_active: payload.is_active }
      }),
    ...options
  })
}

export const useUpsertDefaultCommisionRule = (
  options: UseMutationOptions<
    { commission_rule?: CommissionRule },
    Error,
    UpsertDefaultCommissionRule
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      mercurQuery('/admin/commission/default', {
        method: 'POST',
        body: payload
      }),
    ...options
  })
}

export const useDeleteCommisionRule = (
  options: UseMutationOptions<
    {
      id?: string
      object?: string
      deleted?: boolean
    },
    Error,
    { id: string }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      mercurQuery(`/admin/commission/rules/${payload.id}`, {
        method: 'DELETE'
      }),
    ...options
  })
}

export const useListCommissionLines = (
  query?: Record<string, string | number>
) => {
  return useQuery<
    {
      commission_lines: CommissionLine[]
      count: number
    },
    Error
  >({
    queryKey: ['commission-lines', query],
    queryFn: () =>
      mercurQuery(`/admin/commission/commission-lines`, {
        method: 'GET',
        query
      })
  })
}
