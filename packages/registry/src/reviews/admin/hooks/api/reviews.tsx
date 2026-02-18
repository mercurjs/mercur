import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { sdk } from "@mercurjs/dashboard-shared"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"

export interface ReviewDTO {
  id: string
  reference: "product" | "seller"
  rating: number
  customer_note: string | null
  seller_note: string | null
  created_at: string
  updated_at: string
}

interface ReviewListResponse {
  reviews: ReviewDTO[]
  count: number
  offset: number
  limit: number
}

interface ReviewDetailResponse {
  review: ReviewDTO
}

const REVIEWS_QUERY_KEY = "admin_reviews" as const
export const reviewsQueryKeys = queryKeysFactory(REVIEWS_QUERY_KEY)

export const useReviews = (
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<ReviewListResponse>, "queryKey" | "queryFn">,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.list(query),
    queryFn: async () =>
      sdk.client.fetch<ReviewListResponse>(`/admin/reviews`, {
        query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useReview = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<ReviewDetailResponse>, "queryKey" | "queryFn">,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.client.fetch<ReviewDetailResponse>(`/admin/reviews/${id}`, {
        query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}
