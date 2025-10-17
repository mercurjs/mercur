import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const storesQueryKeys = queryKeysFactory('stores')

export interface AdminStore {
  id: string
  name: string
  supported_currencies: { currency_code: string }[]
  default_sales_channel_id: string
  default_region_id: string
  default_location_id: string
  metadata: object
  created_at: string
  updated_at: string
}

export interface AdminStoreListResponse {
  stores: AdminStore[]
}

export const useStores = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<unknown, Error, AdminStoreListResponse, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: storesQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/stores', {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}
