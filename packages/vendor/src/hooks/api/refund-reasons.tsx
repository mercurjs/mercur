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

const REFUND_REASONS_QUERY_KEY = "refund_reasons" as const;
export const refundReasonsQueryKeys = queryKeysFactory(
  REFUND_REASONS_QUERY_KEY
);

export const useRefundReasons = (
  query?: InferClientInput<typeof sdk.vendor.refundReasons.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.refundReasons.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.refundReasons.query({ ...query }),
    queryKey: refundReasonsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRefundReason = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.refundReasons.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.refundReasons.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.refundReasons.$id.query({ $id: id, ...query }),
    queryKey: refundReasonsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateRefundReason = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.refundReasons.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.refundReasons.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.refundReasons.mutate(payload),
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
    InferClientOutput<typeof sdk.vendor.refundReasons.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.refundReasons.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.refundReasons.$id.mutate({ $id: id, ...payload }),
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
    InferClientOutput<typeof sdk.vendor.refundReasons.$id.delete>,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (id: string) => sdk.vendor.refundReasons.$id.delete({ $id: id }),
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
