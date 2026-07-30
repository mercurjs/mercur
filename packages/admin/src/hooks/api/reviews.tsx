import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { ReviewDTO } from "@mercurjs/types"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const REVIEWS_QUERY_KEY = "reviews" as const
export const reviewsQueryKeys = queryKeysFactory(REVIEWS_QUERY_KEY)

type ReviewCustomer = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

type ReviewOrder = {
  id: string
  display_id: number
  created_at: string
}

type ReviewSeller = {
  id: string
  name: string
  email: string | null
}

export type AdminReview = ReviewDTO & {
  customer?: ReviewCustomer | null
  order?: ReviewOrder | null
  seller?: ReviewSeller | null
}

export const useReview = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.reviews.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.reviews.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.reviews.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.reviews.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useReviews = (
  query?: InferClientInput<typeof sdk.admin.reviews.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.reviews.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.reviews.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.reviews.query({ ...query }),
    queryKey: reviewsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateReview = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.reviews.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.reviews.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.reviews.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRespondReview = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.reviews.$id.respond.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.reviews.$id.respond.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.reviews.$id.respond.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteReview = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.reviews.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.reviews.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
