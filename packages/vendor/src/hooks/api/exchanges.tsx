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
import { returnsQueryKeys } from "./returns";

const EXCHANGES_QUERY_KEY = "exchanges" as const;
export const exchangesQueryKeys = queryKeysFactory(EXCHANGES_QUERY_KEY);

export const useExchange = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.exchanges.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.exchanges.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.exchanges.$id.query({ id, ...query }),
    queryKey: exchangesQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useExchanges = (
  query?: InferClientInput<typeof sdk.admin.exchanges.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.exchanges.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.exchanges.query({ ...query }),
    queryKey: exchangesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateExchange = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.exchanges.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.exchanges.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.exchanges.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelExchange = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.exchanges.$id.cancel.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.exchanges.$id.cancel.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddExchangeInboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.exchanges.$id.inbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.exchanges.$id.inbound.items.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.exchanges.$id.inbound.items.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateExchangeInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.inbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.exchanges.$id.inbound.items.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.exchanges.$id.inbound.items.$actionId.mutate({
        id,
        actionId,
        ...payload,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveExchangeInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.inbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.inbound.items.$actionId.delete({
        id,
        actionId,
      }),
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

export const useAddExchangeInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.inbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.exchanges.$id.inbound.shippingMethod.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.exchanges.$id.inbound.shippingMethod.mutate({
        id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateExchangeInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) =>
      sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.mutate({
        id,
        actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteExchangeInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.delete({
        id,
        actionId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddExchangeOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.exchanges.$id.outbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.exchanges.$id.outbound.items.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.exchanges.$id.outbound.items.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateExchangeOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.outbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.exchanges.$id.outbound.items.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.exchanges.$id.outbound.items.$actionId.mutate({
        id,
        actionId,
        ...payload,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveExchangeOutboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.outbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.outbound.items.$actionId.delete({
        id,
        actionId,
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

export const useAddExchangeOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.outbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.exchanges.$id.outbound.shippingMethod.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.exchanges.$id.outbound.shippingMethod.mutate({
        id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateExchangeOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) =>
      sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.mutate({
        id,
        actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteExchangeOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.delete({
        id,
        actionId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useExchangeConfirmRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.exchanges.$id.request.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.exchanges.$id.request.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.exchanges.$id.request.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelExchangeRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.exchanges.$id.request.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.exchanges.$id.request.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
