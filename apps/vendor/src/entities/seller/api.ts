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
    VendorCreateSeller
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      vendorCreateSeller(payload).then((res) => res.data),
    ...options
  })
}
