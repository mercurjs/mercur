import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { VendorSeller } from '@mercurjs/http-client'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const sellerQueryKeys = queryKeysFactory('seller')

export const useSellers = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { sellers: VendorSeller[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: sellerQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/sellers', {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useInviteSeller = () => {
  return useMutation({
    mutationFn: (email: string) =>
      mercurQuery('/admin/sellers/invite', {
        method: 'POST',
        body: email
      })
  })
}
