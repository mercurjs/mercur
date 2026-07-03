import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { ordersQueryKeys } from "./orders";

const invalidateOrder = (orderId: string) => {
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.details() });
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.preview(orderId) });
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.changes(orderId) });
};

export const useCreateOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.orderEdits.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.orderEdits.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.orderEdits.mutate(payload),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.orderEdits.$id.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.orderEdits.$id.delete({ $id: orderId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRequestOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.orderEdits.$id.request.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.orderEdits.$id.request.mutate({ $id: orderId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useConfirmOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.orderEdits.$id.confirm.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.orderEdits.$id.confirm.mutate({ $id: orderId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddOrderEditItems = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.orderEdits.$id.items.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.orderEdits.$id.items.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.orderEdits.$id.items.mutate({ $id: orderId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateOrderEditAddedItem = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.orderEdits.$id.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.orderEdits.$id.items.$actionId.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ $actionId, ...payload }) =>
      sdk.vendor.orderEdits.$id.items.$actionId.mutate({
        $id: orderId,
        $actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveOrderEditAddedItem = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.orderEdits.$id.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.vendor.orderEdits.$id.items.$actionId.delete({
        $id: orderId,
        $actionId: actionId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateOrderEditOriginalItem = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.orderEdits.$id.items.item.$itemId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.orderEdits.$id.items.item.$itemId.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ $itemId, ...payload }) =>
      sdk.vendor.orderEdits.$id.items.item.$itemId.mutate({
        $id: orderId,
        $itemId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
