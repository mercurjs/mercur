import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { AdminStoreListResponse } from '@mercurjs/http-client'

import { api } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const storesQueryKeys = queryKeysFactory('stores')

export const useStores = (
  query?: Parameters<typeof api.admin.adminGetStores>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminGetStores>[0],
      Error,
      AdminStoreListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: storesQueryKeys.list(query),
    queryFn: () => api.admin.adminGetStores(query).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}
