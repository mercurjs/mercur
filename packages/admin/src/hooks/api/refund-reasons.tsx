import { FetchError } from "@medusajs/js-sdk";
import type {
  AdminRefundReasonDeleteResponse,
  HttpTypes,
} from "@medusajs/types";

import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import type {
  AdminRefundReasonListParams,
  AdminRefundReasonListResponse,
  AdminRefundReasonParams,
  AdminRefundReasonResponse,
  AdminUpdateRefundReason,
} from "@custom-types/refund-reasons";

import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const REFUND_REASONS_QUERY_KEY = "refund_reasons" as const;
export const refundReasonsQueryKeys = queryKeysFactory(
  REFUND_REASONS_QUERY_KEY,
);

export const useRefundReasons = (
  query?: AdminRefundReasonListParams,
  options?: Omit<
    UseQueryOptions<
      AdminRefundReasonListResponse,
      FetchError,
      AdminRefundReasonListResponse
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.refundReason.list(
        query,
      ) as Promise<AdminRefundReasonListResponse>,
    queryKey: refundReasonsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRefundReason = (
  id: string,
  query?: AdminRefundReasonParams,
  options?: Omit<
    UseQueryOptions<
      AdminRefundReasonResponse,
      FetchError,
      AdminRefundReasonResponse
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.client.fetch<AdminRefundReasonResponse>(
        `/admin/refund-reasons/${id}`,
        {
          query,
        },
      ),
    queryKey: refundReasonsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateRefundReason = (
  query?: AdminRefundReasonParams,
  options?: UseMutationOptions<
    HttpTypes.RefundReasonResponse,
    FetchError,
    HttpTypes.AdminCreateRefundReason
  >,
) => {
  return useMutation({
    mutationFn: async (data) =>
      sdk.client.fetch(`/admin/refund-reasons`, {
        method: "POST",
        query,
        body: data,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateRefundReason = (
  id: string,
  options?: UseMutationOptions<
    AdminRefundReasonResponse,
    FetchError,
    AdminUpdateRefundReason
  >,
) => {
  return useMutation({
    mutationFn: async (data) =>
      sdk.client.fetch<AdminRefundReasonResponse>(
        `/admin/refund-reasons/${id}`,
        {
          method: "POST",
          body: data,
        },
      ) as Promise<AdminRefundReasonResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.detail(data.refund_reason.id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteRefundReasonLazy = (
  options?: UseMutationOptions<
    HttpTypes.AdminRefundReasonDeleteResponse,
    FetchError,
    string
  >,
) => {
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<AdminRefundReasonDeleteResponse>(
        `/admin/refund-reasons/${id}`,
        {
          method: "DELETE",
        },
      ) as Promise<AdminRefundReasonDeleteResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
