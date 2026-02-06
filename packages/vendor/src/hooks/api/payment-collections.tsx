import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { ordersQueryKeys } from "./orders";

const PAYMENT_COLLECTION_QUERY_KEY = "payment-collection" as const;
export const paymentCollectionQueryKeys = queryKeysFactory(
  PAYMENT_COLLECTION_QUERY_KEY
);

export const useCreatePaymentCollection = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.paymentCollections.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.paymentCollections.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.paymentCollections.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: paymentCollectionQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useMarkPaymentCollectionAsPaid = (
  orderId: string,
  paymentCollectionId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.paymentCollections.$id.markAsPaid.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.paymentCollections.$id.markAsPaid.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.paymentCollections.$id.markAsPaid.mutate({
        id: paymentCollectionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: paymentCollectionQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeletePaymentCollection = (
  orderId: string,
  options?: Omit<
    UseMutationOptions<
      InferClientOutput<typeof sdk.admin.paymentCollections.$id.delete>,
      ClientError,
      string
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: (id: string) =>
      sdk.admin.paymentCollections.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: paymentCollectionQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
