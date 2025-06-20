import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'
import {
  AdminOrderReturnRequest,
  AdminUpdateOrderReturnRequest
} from '../../routes/requests/types'

export const returnRequestsQueryKeys = queryKeysFactory('return-request')

export const useReturnRequests = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { order_return_request: AdminOrderReturnRequest[]; count?: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: returnRequestsQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/return-request', {
        method: 'GET',
        query
      }),
    ...options
  })

  return { ...data, ...other }
}

export const useReviewReturnRequest = (
  options: UseMutationOptions<
    { orderReturnRequest?: AdminOrderReturnRequest },
    Error,
    { id: string; payload: AdminUpdateOrderReturnRequest }
  >
) => {
  return useMutation({
    mutationFn: ({ id, payload }) =>
      mercurQuery(`/admin/return-request/${id}`, {
        method: 'POST',
        body: payload
      }),
    ...options
  })
}
