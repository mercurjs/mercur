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

const PAYMENT_QUERY_KEY = "payment" as const;
export const paymentQueryKeys = queryKeysFactory(PAYMENT_QUERY_KEY);

const PAYMENT_PROVIDERS_QUERY_KEY = "payment_providers" as const;
export const paymentProvidersQueryKeys = queryKeysFactory(
  PAYMENT_PROVIDERS_QUERY_KEY
);

export const usePaymentProviders = (
  query: InferClientInput<typeof sdk.admin.payments.paymentProviders.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.payments.paymentProviders.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.payments.paymentProviders.query({ ...query }),
    queryKey: paymentProvidersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePayment = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.payments.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.payments.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.payments.$id.query({ id, ...query }),
    queryKey: paymentQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCapturePayment = (
  orderId: string,
  paymentId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.payments.$id.capture.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.payments.$id.capture.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.payments.$id.capture.mutate({ id: paymentId, ...payload }),
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

export const useRefundPayment = (
  orderId: string,
  paymentId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.payments.$id.refund.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.payments.$id.refund.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.payments.$id.refund.mutate({ id: paymentId, ...payload }),
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
