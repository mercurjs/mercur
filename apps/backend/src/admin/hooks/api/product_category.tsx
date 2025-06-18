import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { ProductCategoryDTO } from '@medusajs/framework/types'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const productCategoryQueryKeys = queryKeysFactory('product_category')

export const useProductCategory = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_category?: ProductCategoryDTO },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productCategoryQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/product-categories/${id}`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useProductCategories = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_categories: ProductCategoryDTO[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productCategoryQueryKeys.list(query),
    queryFn: () =>
      mercurQuery(`/admin/product-categories`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}
