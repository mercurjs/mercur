import { queryKeysFactory } from '@/shared/lib'
import { vendorCreateSeller, vendorGetSellerMe } from '@mercurjs/http-client'
import { FetchError } from '@mercurjs/http-client/client'
import {
  VendorCreateSeller,
  VendorCreateSeller201
} from '@mercurjs/http-client/types'
import {
  useMutation,
  UseMutationOptions,
  useQuery
} from '@tanstack/react-query'

const SELLER_QUERY_KEY = 'seller'
export const sellerQueryKeys = queryKeysFactory(SELLER_QUERY_KEY)

export const useCreateSeller = (
  options?: UseMutationOptions<
    VendorCreateSeller201,
    FetchError,
    VendorCreateSeller & { token: string }
  >
) => {
  return useMutation({
    mutationFn: ({ token, ...payload }) =>
      vendorCreateSeller(payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((res) => res.data),
    ...options
  })
}

export const useSeller = () => {
  const { data, ...other } = useQuery({
    queryKey: sellerQueryKeys.details(),
    queryFn: () => vendorGetSellerMe().then((res) => res.data),
    retry: false
  })

  return { ...data, ...other }
}
