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

const CLAIMS_QUERY_KEY = "claims" as const;
export const claimsQueryKeys = queryKeysFactory(CLAIMS_QUERY_KEY);

const invalidateOrder = (orderId: string) => {
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.details() });
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.preview(orderId) });
  queryClient.invalidateQueries({ queryKey: ordersQueryKeys.changes(orderId) });
  queryClient.invalidateQueries({ queryKey: claimsQueryKeys.lists() });
};

export const useClaim = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.vendor.claims.$id.query>, "$id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.claims.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.vendor.claims.$id.query({ $id: id, ...query }),
    queryKey: claimsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useClaims = (
  query?: InferClientInput<typeof sdk.vendor.claims.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.claims.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.vendor.claims.query({ ...query }),
    queryKey: claimsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateClaim = (
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.claims.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.claims.mutate(payload),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelClaimBegin = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.$id.request.delete>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.claims.$id.request.delete({ $id: claimId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRequestClaim = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.$id.request.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.claims.$id.request.mutate({ $id: claimId }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCancelClaim = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.$id.cancel.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.claims.$id.cancel.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.claims.$id.cancel.mutate({ $id: claimId, ...payload }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddClaimItems = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.$id.claimItems.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.claims.$id.claimItems.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.claims.$id.claimItems.mutate({ $id: claimId, ...payload }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateClaimItem = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.claimItems.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.claims.$id.claimItems.$actionId.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: ({ $actionId, ...payload }) =>
      sdk.vendor.claims.$id.claimItems.$actionId.mutate({
        $id: claimId,
        $actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveClaimItem = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.claimItems.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.vendor.claims.$id.claimItems.$actionId.delete({
        $id: claimId,
        $actionId: actionId,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddClaimInboundItems = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.$id.inbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.claims.$id.inbound.items.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.claims.$id.inbound.items.mutate({
        $id: claimId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddClaimOutboundItems = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.claims.$id.outbound.items.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.claims.$id.outbound.items.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.claims.$id.outbound.items.mutate({
        $id: claimId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddClaimInboundShipping = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.inbound.shippingMethod.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.claims.$id.inbound.shippingMethod.mutate
      >,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.claims.$id.inbound.shippingMethod.mutate({
        $id: claimId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateClaimInboundItem = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.inbound.items.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.claims.$id.inbound.items.$actionId.mutate
      >,
      "$id"
    > & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, $actionId: _ignored, ...payload }) =>
      sdk.vendor.claims.$id.inbound.items.$actionId.mutate({
        $id: claimId,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveClaimInboundItem = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.inbound.items.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.vendor.claims.$id.inbound.items.$actionId.delete({
        $id: claimId,
        $actionId: actionId,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      queryClient.invalidateQueries({ queryKey: returnsQueryKeys.details() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateClaimInboundShipping = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.inbound.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.claims.$id.inbound.shippingMethod.$actionId.mutate
      >,
      "$id"
    > & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, $actionId: _ignored, ...payload }) =>
      sdk.vendor.claims.$id.inbound.shippingMethod.$actionId.mutate({
        $id: claimId,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteClaimInboundShipping = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.inbound.shippingMethod.$actionId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.vendor.claims.$id.inbound.shippingMethod.$actionId.delete({
        $id: claimId,
        $actionId: actionId,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateClaimOutboundShipping = (
  claimId: string,
  orderId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.claims.$id.outbound.shippingMethod.$actionId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.claims.$id.outbound.shippingMethod.$actionId.mutate
      >,
      "$id"
    > & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ actionId, $actionId: _ignored, ...payload }) =>
      sdk.vendor.claims.$id.outbound.shippingMethod.$actionId.mutate({
        $id: claimId,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      invalidateOrder(orderId);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// Aliases matching admin's naming for the existing vendor request endpoints.
// Mercur splits a claim begin (`POST /vendor/claims`) from the request
// confirmation (`POST /vendor/claims/:id/request`) and the request cancel
// (`DELETE /vendor/claims/:id/request`); admin labels these as
// `claimConfirmRequest` / `cancelClaimRequest`, so the form code can read
// 1:1 with admin.
export const useClaimConfirmRequest = useRequestClaim;
export const useCancelClaimRequest = useCancelClaimBegin;
