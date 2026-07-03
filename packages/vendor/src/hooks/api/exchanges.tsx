import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
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

const EXCHANGES_QUERY_KEY = "exchanges" as const;
export const exchangesQueryKeys = queryKeysFactory(EXCHANGES_QUERY_KEY);

const invalidateOrder = (orderId: string) => {
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.details() });
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.preview(orderId) });
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.changes(orderId) });
  queryClient.invalidateQueries({ queryKey: exchangesQueryKeys.lists() });
};

export const useExchanges = (
  query?: InferClientInput<typeof sdk.vendor.exchanges.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.exchanges.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.vendor.exchanges.query({ ...query }),
    queryKey: exchangesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateExchange = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.exchanges.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.exchanges.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.exchanges.mutate(payload),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelExchangeBegin = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.exchanges.$id.request.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.exchanges.$id.request.delete({ $id: exchangeId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRequestExchange = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.exchanges.$id.request.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.exchanges.$id.request.mutate({ $id: exchangeId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelExchange = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.exchanges.$id.cancel.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.exchanges.$id.cancel.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.exchanges.$id.cancel.mutate({ $id: exchangeId, ...payload }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddExchangeInboundItems = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.exchanges.$id.inbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.exchanges.$id.inbound.items.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.exchanges.$id.inbound.items.mutate({
        $id: exchangeId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateExchangeInboundItem = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.exchanges.$id.inbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.exchanges.$id.inbound.items.$actionId.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ $actionId, ...payload }) =>
      sdk.vendor.exchanges.$id.inbound.items.$actionId.mutate({
        $id: exchangeId,
        $actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveExchangeInboundItem = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.exchanges.$id.inbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.vendor.exchanges.$id.inbound.items.$actionId.delete({
        $id: exchangeId,
        $actionId: actionId,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddExchangeOutboundItems = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.exchanges.$id.outbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.exchanges.$id.outbound.items.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.exchanges.$id.outbound.items.mutate({
        $id: exchangeId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateExchangeOutboundItem = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.exchanges.$id.outbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.exchanges.$id.outbound.items.$actionId.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ $actionId, ...payload }) =>
      sdk.vendor.exchanges.$id.outbound.items.$actionId.mutate({
        $id: exchangeId,
        $actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveExchangeOutboundItem = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.exchanges.$id.outbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.vendor.exchanges.$id.outbound.items.$actionId.delete({
        $id: exchangeId,
        $actionId: actionId,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddExchangeInboundShipping = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.exchanges.$id.inbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.exchanges.$id.inbound.shippingMethod.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.exchanges.$id.inbound.shippingMethod.mutate({
        $id: exchangeId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddExchangeOutboundShipping = (
  exchangeId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.exchanges.$id.outbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.exchanges.$id.outbound.shippingMethod.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.exchanges.$id.outbound.shippingMethod.mutate({
        $id: exchangeId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
