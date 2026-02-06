import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const RETURN_REASONS_QUERY_KEY = "return_reasons" as const;
export const returnReasonsQueryKeys = queryKeysFactory(RETURN_REASONS_QUERY_KEY);

export const useReturnReasons = (
  query?: InferClientInput<typeof sdk.admin.returnReasons.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.returnReasons.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.returnReasons.query({ ...query }),
    queryKey: returnReasonsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useReturnReason = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.returnReasons.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.returnReasons.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.returnReasons.$id.query({ id, ...query }),
    queryKey: returnReasonsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateReturnReason = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returnReasons.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.returnReasons.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.returnReasons.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: returnReasonsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateReturnReason = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returnReasons.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.returnReasons.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returnReasons.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: returnReasonsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: returnReasonsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteReturnReason = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returnReasons.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returnReasons.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: returnReasonsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: returnReasonsQueryKeys.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: returnReasonsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
