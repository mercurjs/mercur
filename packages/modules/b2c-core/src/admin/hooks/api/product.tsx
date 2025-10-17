import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

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

export const useProductAttributes = (id: string) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      mercurQuery(`/admin/products/${id}/applicable-attributes`, {
        method: 'GET'
      }),
    queryKey: ['product', id, 'product-attributes']
  })

  return { ...data, ...rest }
}

export const useUpdateProduct = (
  id: string,
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: any) => {
      return mercurQuery(`/admin/products/${id}`, {
        method: 'POST',
        body: {
          ...payload
        }
      })
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: productQueryKeys.detail(id)
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options
  })
}
