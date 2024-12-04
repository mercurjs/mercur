import {
  postVendorTypeAuthProviderRegister,
  storePostSession
} from '@mercurjs/http-client'
import {
  AuthResponse,
  PostVendorTypeAuthProviderRegisterBody
} from '@mercurjs/http-client/types'
import { FetchError } from '@mercurjs/http-client/client'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'

export const useEmailpassLogin = (
  options?: UseMutationOptions<
    AuthResponse,
    FetchError,
    PostVendorTypeAuthProviderRegisterBody
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      postVendorTypeAuthProviderRegister('emailpass', payload).then(
        (res) => res.data
      ),
    ...options
  })
}

export const useCreateSession = (
  options?: UseMutationOptions<void, FetchError, void>
) => {
  return useMutation({
    mutationFn: () => storePostSession().then(() => undefined),
    ...options
  })
}
