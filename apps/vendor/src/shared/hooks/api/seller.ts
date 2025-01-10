import { queryKeysFactory } from '@/shared/lib'

import {
  useMutation,
  UseMutationOptions,
  useQuery
} from '@tanstack/react-query'
import { api } from './config'
import { VendorCreateSeller, VendorSeller } from '@mercurjs/http-client'

const SELLER_QUERY_KEY = 'seller'
export const sellerQueryKeys = queryKeysFactory(SELLER_QUERY_KEY)

export const useCreateSeller = (
  options?: UseMutationOptions<
    { seller?: VendorSeller },
    Error,
    VendorCreateSeller & { token: string }
  >
) => {
  return useMutation({
    mutationFn: ({ token, ...payload }) =>
      api.vendor
        .vendorCreateSeller(payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((res) => res.data),
    ...options
  })
}

export const useSeller = () => {
  const { data, ...other } = useQuery({
    queryKey: sellerQueryKeys.details(),
    queryFn: () => api.vendor.vendorGetSellerMe().then((res) => res.data),
    retry: false
  })

  return { ...data, ...other }
}
