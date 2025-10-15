import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { mercurQuery } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";

export interface Order {
  id: string;
  region_id: string;
  customer_id: string;
  version: number;
  sales_channel_id: string;
  status: string;
  is_draft_order: boolean;
  email: string;
  currency_code: string;
  no_notification: boolean;
  metadata: null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  shipping_address_id: string;
  billing_address_id: string;
  items: { id: string }[];
}

export interface OrderResponse {
  order: Order;
}

export const orderQueryKeys = queryKeysFactory("order");

export const useOrder = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, OrderResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/orders/${id}`, {
        method: "GET",
      }),
    ...options,
  });

  return { ...data, ...other };
};
