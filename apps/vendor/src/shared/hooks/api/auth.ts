import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib'
import { sellerQueryKeys } from './seller'
import { api } from './config'
import { AuthResponse } from '@mercurjs/http-client'

type EmailpassAuthRequest = {
  email: string
  password: string
}

export const useEmailpassRegister = (
  options?: UseMutationOptions<AuthResponse, Error, EmailpassAuthRequest>
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.auth
        .postSellerTypeAuthProviderRegister('emailpass', payload)
        .then((res) => res.data),
    ...options
  })
}

export const useEmailpassLogin = (
  options?: UseMutationOptions<AuthResponse, Error, EmailpassAuthRequest>
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.auth
        .postSellerTypeAuthProvider('emailpass', payload)
        .then((res) => res.data as AuthResponse),
    onSuccess: (data, ...otherArgs) => {
      queryClient.invalidateQueries({
        queryKey: sellerQueryKeys.details()
      })
      options?.onSuccess?.(data, ...otherArgs)
    },
    ...options
  })
}

export const useCreateSession = (
  options?: UseMutationOptions<void, Error, { token: string }>
) => {
  return useMutation({
    mutationFn: ({ token }) =>
      api.auth
        .storePostSession({
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then(() => undefined),
    ...options
  })
}

export const useLogout = () => {
  return useMutation({
    mutationFn: () => api.auth.storeDeleteSession().then(() => undefined)
  })
}
