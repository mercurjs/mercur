import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeysFactory } from "@mercurjs/dashboard-shared";
import { client } from "../../lib/client";
import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";

const REVIEWS_QUERY_KEY = "admin_reviews" as const;
export const reviewsQueryKeys = queryKeysFactory(REVIEWS_QUERY_KEY);

export type ReviewDTO = InferClientOutput<
  typeof client.admin.reviews.$id.query
>["review"];

export const useReviews = (
  query?: InferClientInput<typeof client.admin.reviews.query>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.admin.reviews.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.list(query),
    queryFn: async () =>
      client.admin.reviews.query({
        ...query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useReview = (
  id: string,
  query?: InferClientInput<typeof client.admin.reviews.$id.query>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.admin.reviews.$id.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.detail(id, query),
    queryFn: async () =>
      client.admin.reviews.$id.query({
        $id: id,
        ...query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};
