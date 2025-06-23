import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const productQueryKeys = queryKeysFactory('product')

export const useProduct = (
  id: string,
  query?: any,
  options?: Omit<
    UseQueryOptions<unknown, Error, { product?: any }, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/products/${id}`, {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}
