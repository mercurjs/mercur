import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  QueryKey,
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
  query?: InferClientInput<typeof sdk.admin.refundReasons.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.refundReasons.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.refundReasons.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.refundReasons.query({ ...query }),
    queryKey: refundReasonsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRefundReason = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.refundReasons.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.refundReasons.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.refundReasons.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.refundReasons.$id.query({ $id: id, ...query }),
    queryKey: refundReasonsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateRefundReason = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.refundReasons.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.refundReasons.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.refundReasons.mutate(payload),
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
    InferClientOutput<typeof sdk.admin.refundReasons.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.refundReasons.$id.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.refundReasons.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: refundReasonsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteRefundReasonLazy = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.refundReasons.$id.delete>,
    ClientError,
    string
  >,
) => {
  return useMutation({
    mutationFn: (id: string) => sdk.admin.refundReasons.$id.delete({ $id: id }),
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
