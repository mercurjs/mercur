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
import { HttpTypes } from "@medusajs/types";

const CLAIMS_QUERY_KEY = "claims" as const;
export const claimsQueryKeys = queryKeysFactory(CLAIMS_QUERY_KEY);

export const useClaim = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.claims.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.claims.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.claims.$id.query({ id, ...query }),
    queryKey: claimsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useClaims = (
  query?: InferClientInput<typeof sdk.admin.claims.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.claims.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.claims.query({ ...query }),
    queryKey: claimsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateClaim = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.claims.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.claims.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelClaim = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.cancel.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.claims.$id.cancel.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddClaimItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.claimItems.mutate>,
    ClientError,
    HttpTypes.AdminAddClaimItems
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.claimItems.mutate({ id, ...payload }),
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

export const useUpdateClaimItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.claimItems.$actionId.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.claims.$id.claimItems.$actionId.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.claims.$id.claimItems.$actionId.mutate({
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

export const useRemoveClaimItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.claimItems.$actionId.delete>,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.claimItems.$actionId.delete({ id, actionId }),
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

export const useAddClaimInboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.inbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.claims.$id.inbound.items.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.inbound.items.mutate({ id, ...payload }),
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

export const useUpdateClaimInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.inbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.claims.$id.inbound.items.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.claims.$id.inbound.items.$actionId.mutate({
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

export const useRemoveClaimInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.inbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.inbound.items.$actionId.delete({ id, actionId }),
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

export const useAddClaimInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.inbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.claims.$id.inbound.shippingMethod.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.inbound.shippingMethod.mutate({
        id,
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

export const useUpdateClaimInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.inbound.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.claims.$id.inbound.shippingMethod.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) =>
      sdk.admin.claims.$id.inbound.shippingMethod.$actionId.mutate({
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

export const useDeleteClaimInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.inbound.shippingMethod.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.inbound.shippingMethod.$actionId.delete({
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

export const useAddClaimOutboundItems: any = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.outbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.claims.$id.outbound.items.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.outbound.items.mutate({ id, ...payload }),
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

export const useUpdateClaimOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.outbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.claims.$id.outbound.items.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) => {
      return sdk.admin.claims.$id.outbound.items.$actionId.mutate({
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

export const useRemoveClaimOutboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.outbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.outbound.items.$actionId.delete({ id, actionId }),
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

export const useAddClaimOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.outbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.claims.$id.outbound.shippingMethod.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.outbound.shippingMethod.mutate({
        id,
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

export const useUpdateClaimOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.outbound.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.claims.$id.outbound.shippingMethod.$actionId.mutate
      >,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, ...payload }) =>
      sdk.admin.claims.$id.outbound.shippingMethod.$actionId.mutate({
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

export const useDeleteClaimOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.claims.$id.outbound.shippingMethod.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.outbound.shippingMethod.$actionId.delete({
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

export const useClaimConfirmRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.request.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.claims.$id.request.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.request.mutate({ id, ...payload }),
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
        queryKey: claimsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelClaimRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.claims.$id.request.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.claims.$id.request.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      });

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      });

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
