import { QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'

import { Review } from '@mercurjs/http-client'

import { api } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const reviewsQueryKeys = queryKeysFactory('reviews')

export const useReview = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, { review?: Review }, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: reviewsQueryKeys.detail(id),
    queryFn: () => api.admin.adminGetReviewById(id).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}
