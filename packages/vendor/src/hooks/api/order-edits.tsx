import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { ordersQueryKeys } from "./orders";
import { reservationItemsQueryKeys } from "./reservations";
import { inventoryItemsQueryKeys } from "./inventory.tsx";

export const useCreateOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.orderEdits.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.orderEdits.mutate(payload),
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

export const useRequestOrderEdit = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.$id.request.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orderEdits.$id.request.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(id),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lineItems(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useConfirmOrderEdit = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.$id.confirm.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orderEdits.$id.confirm.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(id),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lineItems(id),
      });

      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.$id.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orderEdits.$id.delete({ id: orderId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lineItems(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddOrderEditItems = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.$id.items.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.orderEdits.$id.items.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orderEdits.$id.items.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Update (quantity) of an item that was originally on the order.
 */
export const useUpdateOrderEditOriginalItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.orderEdits.$id.items.item.$itemId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.orderEdits.$id.items.item.$itemId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ itemId, ...payload }) => {
      return sdk.admin.orderEdits.$id.items.item.$itemId.mutate({
        id,
        itemId,
        ...payload,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Update (quantity) of an item that was added to the order edit.
 */
export const useUpdateOrderEditAddedItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.$id.items.$actionId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.orderEdits.$id.items.$actionId.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.orderEdits.$id.items.$actionId.mutate({
        id,
        actionId,
        ...payload,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Remove item that was added to the edit.
 * To remove an original item on the order, set quantity to 0.
 */
export const useRemoveOrderEditItem = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.orderEdits.$id.items.$actionId.delete>,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.orderEdits.$id.items.$actionId.delete({ id, actionId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
