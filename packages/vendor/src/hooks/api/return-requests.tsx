import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import type { OrderReturnItemDTO, ReturnDTO } from "@medusajs/types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { ordersQueryKeys } from "./orders";
import { returnsQueryKeys } from "./returns";

const RETURN_REQUESTS_QUERY_KEY = "return_requests" as const;
export const returnRequestsQueryKeys = queryKeysFactory(
  RETURN_REQUESTS_QUERY_KEY,
);

type ReturnRequestListQuery = InferClientInput<
  typeof sdk.vendor.returnRequests.query
>;

type ReturnItemWithRelations = OrderReturnItemDTO & {
  item?: {
    title: string;
    variant_title?: string | null;
    thumbnail?: string | null;
    unit_price?: number | null;
  } | null;
  reason?: { label: string } | null;
  note?: string | null;
};

type ReturnWithRelations = Omit<ReturnDTO, "items"> & {
  items?: ReturnItemWithRelations[];
};

export type VendorReturnRequest = Omit<
  InferClientOutput<typeof sdk.vendor.returnRequests.$id.query>["return_request"],
  "return"
> & {
  return?: ReturnWithRelations | null;
};

const invalidateReturnRequest = (id: string, orderId?: string) => {
  queryClient.invalidateQueries({ queryKey: returnRequestsQueryKeys.lists() });
  queryClient.invalidateQueries({
    queryKey: returnRequestsQueryKeys.detail(id),
  });
  queryClient.invalidateQueries({ queryKey: returnsQueryKeys.all });
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) });
    queryClient.invalidateQueries({
      queryKey: ordersQueryKeys.preview(orderId),
    });
  }
};

// The generated query type is the zod output, so offset/limit/order read as
// required even though the route defaults them.
export const useReturnRequests = (
  query?: Partial<ReturnRequestListQuery>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof sdk.vendor.returnRequests.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.vendor.returnRequests.query({
        ...query,
      } as ReturnRequestListQuery),
    queryKey: returnRequestsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useReturnRequest = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.returnRequests.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof sdk.vendor.returnRequests.$id.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.vendor.returnRequests.$id.query({ $id: id, ...query }),
    queryKey: returnRequestsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateReturnRequest = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.returnRequests.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.returnRequests.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.returnRequests.mutate(payload),
    onSuccess: (data, variables, context) => {
      invalidateReturnRequest(data.return_request.id, variables.order_id);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAcceptReturnRequest = (
  id: string,
  orderId?: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.returnRequests.$id.accept.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.returnRequests.$id.accept.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.returnRequests.$id.accept.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      invalidateReturnRequest(id, orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeclineReturnRequest = (
  id: string,
  orderId?: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.returnRequests.$id.decline.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.returnRequests.$id.decline.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.returnRequests.$id.decline.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      invalidateReturnRequest(id, orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
