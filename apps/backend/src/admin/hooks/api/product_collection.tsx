import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { ProductCollectionDTO } from '@medusajs/framework/types'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const productCollectionQueryKeys = queryKeysFactory('product_collection')

export const useProductCollection = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_collection?: ProductCollectionDTO },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productCollectionQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/product-categories/${id}`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}
