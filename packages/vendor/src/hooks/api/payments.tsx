import { ClientError } from "@mercurjs/client"
import { HttpTypes } from "@medusajs/types";
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
  query: HttpTypes.AdminPaymentProviderListParams,
  options?: UseQueryOptions<unknown, ClientError, HttpTypes.AdminPaymentProviderListResponse>
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.vendor.payments.paymentProviders.query({ ...query }),
    queryKey: paymentProvidersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePayment = (
  id: string,
  query?: Record<string, unknown>,
  options?: UseQueryOptions<unknown, ClientError, HttpTypes.AdminPaymentCollectionResponse>
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.payments.$id.query({ id, ...query }),
    queryKey: paymentQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCapturePayment = (
  orderId: string,
  paymentId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPaymentResponse,
    ClientError,
    HttpTypes.AdminCapturePayment
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCapturePayment) =>
      sdk.vendor.payments.$id.capture.mutate({ id: paymentId, ...payload }),
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
    HttpTypes.AdminPaymentResponse,
    ClientError,
    HttpTypes.AdminRefundPayment
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminRefundPayment) =>
      sdk.vendor.payments.$id.refund.mutate({ id: paymentId, ...payload }),
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
