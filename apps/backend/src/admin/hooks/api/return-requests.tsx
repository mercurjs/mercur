import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  AdminOrderReturnRequest,
  AdminUpdateOrderReturnRequest,
  OrderReturnRequest,
} from "@mercurjs/http-client";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";

export const configurationQueryKeys = queryKeysFactory("retunr-requests");

export const useReturnRequests = (
  query?: Parameters<typeof api.admin.adminListOrderReturnRequests>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminListOrderReturnRequests>[0],
      Error,
      { order_return_request: AdminOrderReturnRequest[]; count?: number },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: configurationQueryKeys.list(query),
    queryFn: () =>
      api.admin.adminListOrderReturnRequests(query).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};

export const useReviewReturnRequest = (
  options: UseMutationOptions<
    { orderReturnRequest?: OrderReturnRequest },
    Error,
    { id: string; payload: AdminUpdateOrderReturnRequest }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, payload }) =>
      api.admin
        .adminUpdateOrderReturnRequestById(id, payload)
        .then((res) => res.data),
    ...options,
  });
};
