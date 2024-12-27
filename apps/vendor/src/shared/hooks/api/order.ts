import { queryKeysFactory } from '@/shared/lib'
import { vendorGetOrder, vendorListOrders } from '@mercurjs/http-client'
import { FetchError } from '@mercurjs/http-client/client'
import {
  VendorListOrdersParams,
  VendorListOrders200,
  VendorGetOrder200
} from '@mercurjs/http-client/types'
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query'

const ORDER_QUERY_KEY = 'order'
export const orderQueryKeys = queryKeysFactory(ORDER_QUERY_KEY)

export const useOrders = (
  query?: VendorListOrdersParams,
  options?: Omit<
    UseQueryOptions<
      VendorListOrdersParams,
      FetchError,
      VendorListOrders200,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.list(query),
    queryFn: () => vendorListOrders(query).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}

export const useOrder = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, FetchError, VendorGetOrder200, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => vendorGetOrder(id).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}
