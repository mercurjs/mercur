import { FetchError } from "@medusajs/js-sdk"
import { PaginatedResponse } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"

const REVIEWS_QUERY_KEY = "reviews" as const
export const reviewsQueryKeys = queryKeysFactory(REVIEWS_QUERY_KEY)

export const useReview = (
  id: string,
  query?: { [key: string]: string | number },
  options?: Omit<
    UseQueryOptions<{ review: any }, FetchError, { review: any }, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.detail(id),
    queryFn: async () =>
      fetchQuery(`/vendor/sellers/me/reviews/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useReviews = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{
        reviews: any
      }>,
      FetchError,
      PaginatedResponse<{
        reviews: any
      }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/sellers/me/reviews", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),

    queryKey: reviewsQueryKeys.list(query),
    ...options,
  })

  return { ...data, reviews: data?.reviews.filter(Boolean) || [], ...rest }
}

export const useUpdateReview = (
  id: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/sellers/me/reviews/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.list(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
