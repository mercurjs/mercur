import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'
import {
  OrderListResponse,
  OrderQueryParams,
  OrderResponse
} from '../../routes/orders/types'

export const orderQueryKeys = queryKeysFactory('order')

export const useOrders = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<OrderQueryParams, Error, OrderListResponse, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/orders', {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useOrder = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, OrderResponse, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/orders/${id}`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}
