import { queryKeysFactory } from '@/shared/lib'
import { api } from './config'
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { VendorOrderDetails } from '@mercurjs/http-client'

const ORDER_QUERY_KEY = 'order'
export const orderQueryKeys = queryKeysFactory(ORDER_QUERY_KEY)

export const useOrders = (
  query?: Parameters<typeof api.vendor.vendorListOrders>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.vendor.vendorListOrders>[0],
      Error,
      { orders: VendorOrderDetails[]; count: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.list(query),
    queryFn: () => api.vendor.vendorListOrders(query).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}

export const useOrder = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, VendorOrderDetails, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => api.vendor.vendorGetOrder(id).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}
