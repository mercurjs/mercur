import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { AdminCurrencyListResponse } from '@mercurjs/http-client'

import { api } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const currenciesQueryKeys = queryKeysFactory('currencies')

export const useCurrencies = (
  query?: Parameters<typeof api.admin.adminGetCurrencies>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminGetCurrencies>[0],
      Error,
      AdminCurrencyListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: currenciesQueryKeys.list(query),
    queryFn: () => api.admin.adminGetCurrencies(query).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}
