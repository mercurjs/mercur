import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'
import { AdminRequest, AdminReviewRequest } from '../../routes/requests/types'

export const requestsQueryKeys = queryKeysFactory('requests')

export const useVendorRequests = (
  query?: any,
  options?: Omit<
    UseQueryOptions<
      any,
      Error,
      {
        requests: AdminRequest[]
        count?: number
      },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: requestsQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/requests', {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useVendorRequest = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, { request?: AdminRequest }, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: requestsQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/requests/${id}`, {
        method: 'GET'
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useReviewRequest = (
  options: UseMutationOptions<
    { id?: string; status?: string },
    Error,
    { id: string; payload: AdminReviewRequest }
  >
) => {
  return useMutation({
    mutationFn: ({ id, payload }) =>
      mercurQuery(`/admin/requests/${id}`, {
        method: 'POST',
        body: payload
      }),
    ...options
  })
}
