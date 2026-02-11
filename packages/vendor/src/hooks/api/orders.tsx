import { ClientError } from "@mercurjs/client"

import { HttpTypes } from "@medusajs/types";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { sdk, fetchQuery } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory, TQueryKey } from "../../lib/query-key-factory";
import { inventoryItemsQueryKeys } from "./inventory";
import { reservationItemsQueryKeys } from "./reservations";

const ORDERS_QUERY_KEY = "orders" as const;
const _orderKeys = queryKeysFactory(ORDERS_QUERY_KEY) as TQueryKey<"orders"> & {
  preview: (orderId: string) => any;
  changes: (orderId: string) => any;
};

_orderKeys.preview = function (id: string) {
  return [this.detail(id), "preview"];
};

_orderKeys.changes = function (id: string) {
  return [this.detail(id), "changes"];
};

export const ordersQueryKeys = _orderKeys;

export const useOrder = (
  id: string,
  query?: HttpTypes.AdminOrderFilters,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    HttpTypes.AdminOrderResponse
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.vendor.orders.$id.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateOrder = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    HttpTypes.AdminUpdateOrder
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateOrder) =>
      sdk.vendor.orders.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useOrderPreview = (
  id: string,
  query?: HttpTypes.AdminOrderFilters,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    HttpTypes.AdminOrderPreviewResponse
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.vendor.orders.$id.preview.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.preview(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOrders = (
  query?: HttpTypes.AdminOrderListParams,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    HttpTypes.AdminOrderListResponse
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.vendor.orders.query({ ...query }),
    queryKey: ordersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOrderChanges = (
  id: string,
  query?: Record<string, unknown>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    HttpTypes.AdminOrderChangesResponse
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.vendor.orders.$id.changes.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.changes(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateOrderFulfillment = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    HttpTypes.AdminCreateOrderFulfillment
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateOrderFulfillment) =>
      sdk.vendor.orders.$id.fulfillments.mutate({ $id: orderId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelOrderFulfillment = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    Record<string, unknown>
  >
) => {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      sdk.vendor.orders.$id.fulfillments.$fulfillmentId.cancel.mutate({
        $id: orderId,
        $fulfillmentId: fulfillmentId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateOrderShipment = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    HttpTypes.AdminCreateOrderShipment
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateOrderShipment) =>
      sdk.vendor.orders.$id.fulfillments.$fulfillmentId.shipments.mutate({
        $id: orderId,
        $fulfillmentId: fulfillmentId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useMarkOrderFulfillmentAsDelivered = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<HttpTypes.AdminOrderResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.orders.$id.fulfillments.$fulfillmentId.markAsDelivered.mutate({
        $id: orderId,
        $fulfillmentId: fulfillmentId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelOrder = (
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminOrderResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.orders.$id.cancel.mutate({ $id: orderId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCompleteOrder = (
  orderId: string,
  options?: UseMutationOptions<any, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/orders/${orderId}/complete`, {
        method: "POST",
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.list(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

type OrderCommission = {
  commission: any
}

export const useOrderCommission = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<OrderCommission, Error, OrderCommission, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      fetchQuery(`/vendor/orders/${id}/commission`, {
        method: "GET",
        query,
      }),
    queryKey: ordersQueryKeys.detail(`${id}/commission`, query),
    ...options,
  });

  return { commission: data?.commission, ...rest };
};
