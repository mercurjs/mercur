import { ClientError } from "@mercurjs/client";
import { HttpTypes } from "@mercurjs/types";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const PAYOUT_CAPTURES_QUERY_KEY = "payout_captures" as const;
export const payoutCapturesQueryKeys = queryKeysFactory(
  PAYOUT_CAPTURES_QUERY_KEY,
);

export type AdminPayoutCapture = HttpTypes.AdminPayoutCapture;
export type AdminPayoutCaptureOrder = HttpTypes.AdminPayoutCaptureOrder;

type PayoutCaptureResponse = HttpTypes.AdminPayoutCaptureResponse;
type PayoutCaptureListResponse = HttpTypes.AdminPayoutCaptureListResponse;
type PayoutCaptureListQuery = { offset?: number; limit?: number };

export const usePayoutCapture = (
  orderGroupId: string,
  options?: Omit<
    UseQueryOptions<
      PayoutCaptureResponse,
      ClientError,
      PayoutCaptureResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.payoutCaptures.$orderGroupId.query({
        $orderGroupId: orderGroupId,
      }) as Promise<PayoutCaptureResponse>,
    queryKey: payoutCapturesQueryKeys.detail(orderGroupId),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePayoutCaptures = (
  query?: PayoutCaptureListQuery,
  options?: Omit<
    UseQueryOptions<
      PayoutCaptureListResponse,
      ClientError,
      PayoutCaptureListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.payoutCaptures.query({
        ...query,
      } as never) as Promise<PayoutCaptureListResponse>,
    queryKey: payoutCapturesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

const invalidate = (orderGroupId: string) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: payoutCapturesQueryKeys.lists(),
    }),
    queryClient.invalidateQueries({
      queryKey: payoutCapturesQueryKeys.detail(orderGroupId),
    }),
  ]);

export const useCapturePayoutCapture = (
  orderGroupId: string,
  options?: UseMutationOptions<PayoutCaptureResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.payoutCaptures.$orderGroupId.capture.mutate({
        $orderGroupId: orderGroupId,
      }) as Promise<PayoutCaptureResponse>,
    onSuccess: async (data, variables, context) => {
      await invalidate(orderGroupId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelPayoutCapture = (
  orderGroupId: string,
  options?: UseMutationOptions<PayoutCaptureResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.payoutCaptures.$orderGroupId.cancel.mutate({
        $orderGroupId: orderGroupId,
      }) as Promise<PayoutCaptureResponse>,
    onSuccess: async (data, variables, context) => {
      await invalidate(orderGroupId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
