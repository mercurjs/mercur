import {
  postSellerTypeAuthProviderRegister,
  postSellerTypeAuthProvider,
  storePostSession
} from '@mercurjs/http-client'
import {
  AuthResponse,
  PostSellerTypeAuthProviderRegisterBody,
  PostSellerTypeAuthProviderBody
} from '@mercurjs/http-client/types'
import { FetchError } from '@mercurjs/http-client/client'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'

export const useEmailpassRegister = (
  options?: UseMutationOptions<
    AuthResponse,
    FetchError,
    PostSellerTypeAuthProviderRegisterBody
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      postSellerTypeAuthProviderRegister('emailpass', payload).then(
        (res) => res.data
      ),
    ...options
  })
}

export const useEmailpassLogin = (
  options?: UseMutationOptions<
    AuthResponse,
    FetchError,
    PostSellerTypeAuthProviderBody
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      postSellerTypeAuthProvider('emailpass', payload).then(
        (res) => res.data as AuthResponse
      ),
    ...options
  })
}

export const useCreateSession = (
  options?: UseMutationOptions<void, FetchError, { token: string }>
) => {
  return useMutation({
    mutationFn: ({ token }) =>
      storePostSession({
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(() => undefined),
    ...options
  })
}
