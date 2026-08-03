import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const REVIEWS_QUERY_KEY = "reviews" as const;
export const reviewsQueryKeys = queryKeysFactory(REVIEWS_QUERY_KEY);

export type ReviewCustomer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type ReviewOrder = {
  id: string;
  display_id: number;
  created_at: string;
};

export type ReviewDTO = InferClientOutput<
  typeof sdk.vendor.reviews.$id.query
>["review"] & {
  customer?: ReviewCustomer | null;
  order?: ReviewOrder | null;
};

export const useReviews = (
  query?: InferClientInput<typeof sdk.vendor.reviews.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.reviews.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.list(query),
    queryFn: async () => sdk.vendor.reviews.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useReview = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.vendor.reviews.$id.query>, "$id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.reviews.$id.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.detail(id, query),
    queryFn: async () => sdk.vendor.reviews.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRespondReview = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.reviews.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.reviews.$id.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.reviews.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.detail(id) });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
