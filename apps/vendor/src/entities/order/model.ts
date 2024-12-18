import { queryKeysFactory } from '@/shared/lib'
import { useQuery } from '@tanstack/react-query'

const ORDER_QUERY_KEY = 'order'
export const orderQueryKeys = queryKeysFactory(ORDER_QUERY_KEY)

export const useOrders = () => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.details(),
    queryFn: () => vendorGetOrd().then((res) => res.data),
    retry: false
  })

  return { ...data, ...other }
}
