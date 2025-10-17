import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { ProductTypeDTO } from '@medusajs/framework/types'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const productTypeQueryKeys = queryKeysFactory('product_type')

export const useProductType = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_type?: ProductTypeDTO },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productTypeQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/product-types/${id}`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useProductTypes = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_types: ProductTypeDTO[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productTypeQueryKeys.list(query),
    queryFn: () =>
      mercurQuery(`/admin/product-types`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}
