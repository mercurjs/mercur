import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

export interface Review {
  id: string;
  rating: number;
  reference: "seller" | "product";
  customer_id: string;
  customer_note?: string | null;
  seller_note?: string | null;
}

export const reviewsQueryKeys = queryKeysFactory("reviews");

export const useReview = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, { review?: Review }, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: reviewsQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/reviews/${id}`, {
        method: "GET",
      }),
    ...options,
  });

  return { ...data, ...other };
};
