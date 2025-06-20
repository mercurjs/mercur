import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { ProductTagDTO } from '@medusajs/framework/types'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const productTagsQueryKeys = queryKeysFactory('product_tags')

export const useProductTags = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<
      Record<string, unknown>,
      Error,
      { product_tags: ProductTagDTO[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: () =>
      mercurQuery(`/admin/product-tags`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}
