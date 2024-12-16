import { vendorCreateSeller } from '@mercurjs/http-client'
import { FetchError } from '@mercurjs/http-client/client'
import {
  VendorCreateSeller,
  VendorCreateSeller201
} from '@mercurjs/http-client/types'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'

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

export const useSeller = () => {}
