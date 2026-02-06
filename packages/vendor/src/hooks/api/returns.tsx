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

const RETURNS_QUERY_KEY = "returns" as const;
export const returnsQueryKeys = queryKeysFactory(RETURNS_QUERY_KEY);

export const useReturn = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.returns.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.returns.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.returns.$id.query({ id, ...query }),
    queryKey: returnsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useReturns = (
  query?: InferClientInput<typeof sdk.admin.returns.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.returns.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.returns.query({ ...query }),
    queryKey: returnsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInitiateReturn = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.returns.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.returns.mutate(payload),
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

export const useCancelReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.cancel.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returns.$id.cancel.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * REQUEST RETURN
 */

export const useConfirmReturnRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.request.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.returns.$id.request.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.request.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelReturnRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.request.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returns.$id.request.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.requestItems.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.returns.$id.requestItems.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.requestItems.mutate({ id, ...payload }),
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

export const useUpdateReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.requestItems.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.returns.$id.requestItems.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.returns.$id.requestItems.$actionId.mutate({
        id,
        actionId,
        ...payload,
      });
    },
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

export const useRemoveReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.requestItems.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.returns.$id.requestItems.$actionId.delete({ id, actionId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.returns.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      return sdk.admin.returns.$id.mutate({ id, ...payload });
    },
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

export const useAddReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.shippingMethod.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.returns.$id.shippingMethod.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.shippingMethod.mutate({ id, ...payload }),
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

export const useUpdateReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.returns.$id.shippingMethod.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) =>
      sdk.admin.returns.$id.shippingMethod.$actionId.mutate({
        id,
        actionId,
        ...payload,
      }),
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

export const useDeleteReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.shippingMethod.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.returns.$id.shippingMethod.$actionId.delete({ id, actionId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * RECEIVE RETURN
 */

export const useInitiateReceiveReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.receive.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.returns.$id.receive.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.receive.mutate({ id, ...payload }),
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

export const useAddReceiveItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.receiveItems.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.returns.$id.receiveItems.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.receiveItems.mutate({ id, ...payload }),
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

export const useUpdateReceiveItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.receiveItems.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.returns.$id.receiveItems.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.returns.$id.receiveItems.$actionId.mutate({
        id,
        actionId,
        ...payload,
      });
    },
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

export const useRemoveReceiveItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.receiveItems.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) => {
      return sdk.admin.returns.$id.receiveItems.$actionId.delete({
        id,
        actionId,
      });
    },
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

export const useAddDismissItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.dismissItems.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.returns.$id.dismissItems.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.dismissItems.mutate({ id, ...payload }),
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

export const useUpdateDismissItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.dismissItems.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.returns.$id.dismissItems.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.returns.$id.dismissItems.$actionId.mutate({
        id,
        actionId,
        ...payload,
      });
    },
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

export const useRemoveDismissItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.returns.$id.dismissItems.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) => {
      return sdk.admin.returns.$id.dismissItems.$actionId.delete({
        id,
        actionId,
      });
    },
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

export const useConfirmReturnReceive = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.receive.confirm.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.returns.$id.receive.confirm.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.returns.$id.receive.confirm.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelReceiveReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.returns.$id.receive.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returns.$id.receive.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      });

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
