import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
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
  lineItems: (orderId: string) => any;
  shippingOptions: (orderId: string) => any;
};

_orderKeys.preview = function (id: string) {
  return [this.detail(id), "preview"];
};

_orderKeys.changes = function (id: string) {
  return [this.detail(id), "changes"];
};

_orderKeys.lineItems = function (id: string) {
  return [this.detail(id), "lineItems"];
};

_orderKeys.shippingOptions = function (id: string) {
  return [this.detail(id), "shippingOptions"];
};

export const ordersQueryKeys = _orderKeys;

export const useOrder = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.orders.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.orders.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.orders.$id.query({ id, ...query }),
    queryKey: ordersQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateOrder = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.orders.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.mutate({ id, ...payload }),
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
  query?: Omit<
    InferClientInput<typeof sdk.admin.orders.$id.preview.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.orders.$id.preview.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.preview.query({ id, ...query }),
    queryKey: ordersQueryKeys.preview(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOrders = (
  query?: InferClientInput<typeof sdk.admin.orders.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.orders.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.orders.query({ ...query }),
    queryKey: ordersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOrderShippingOptions = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.orders.$id.shippingOptions.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.orders.$id.shippingOptions.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.shippingOptions.query({ id, ...query }),
    queryKey: ordersQueryKeys.shippingOptions(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOrderChanges = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.orders.$id.changes.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.orders.$id.changes.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.changes.query({ id, ...query }),
    queryKey: ordersQueryKeys.changes(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useOrderLineItems = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.orders.$id.lineItems.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.orders.$id.lineItems.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.lineItems.query({ id, ...query }),
    queryKey: ordersQueryKeys.lineItems(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateOrderFulfillment = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.$id.fulfillments.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.orders.$id.fulfillments.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.fulfillments.mutate({ id: orderId, ...payload }),
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
    InferClientOutput<
      typeof sdk.admin.orders.$id.fulfillments.$fulfillmentId.cancel.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.orders.$id.fulfillments.$fulfillmentId.cancel.mutate
      >,
      "id" | "fulfillmentId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.fulfillments.$fulfillmentId.cancel.mutate({
        id: orderId,
        fulfillmentId,
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
    InferClientOutput<
      typeof sdk.admin.orders.$id.fulfillments.$fulfillmentId.shipments.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.orders.$id.fulfillments.$fulfillmentId.shipments.mutate
      >,
      "id" | "fulfillmentId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.fulfillments.$fulfillmentId.shipments.mutate({
        id: orderId,
        fulfillmentId,
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
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.orders.$id.fulfillments.$fulfillmentId.markAsDelivered.mutate
    >,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.orders.$id.fulfillments.$fulfillmentId.markAsDelivered.mutate({
        id: orderId,
        fulfillmentId,
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
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.$id.cancel.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.orders.$id.cancel.mutate({ id: orderId }),
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

export const useRequestTransferOrder = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.$id.transfer.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.orders.$id.transfer.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.transfer.mutate({ id: orderId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelOrderTransfer = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.$id.transfer.cancel.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.orders.$id.transfer.cancel.mutate({ id: orderId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateOrderCreditLine = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.$id.creditLines.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.orders.$id.creditLines.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.creditLines.mutate({ id: orderId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateOrderChange = (
  orderChangeId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderChanges.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.orderChanges.$id.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orderChanges.$id.mutate({ id: orderChangeId, ...payload }),
    onSuccess: (data, variables, context) => {
      const orderId = data.order_change.order_id;

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useExportOrders = (
  query?: InferClientInput<typeof sdk.admin.orders.export.mutate>,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orders.export.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.orders.export.mutate>
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orders.export.mutate({ ...query }),
    onSuccess: (data, variables, context) => {
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
