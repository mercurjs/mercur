import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
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

const SELLERS_QUERY_KEY = "sellers" as const;
export const sellersQueryKeys = queryKeysFactory(SELLERS_QUERY_KEY);

const SELLER_MEMBERS_QUERY_KEY = "seller_members" as const;
export const sellerMembersQueryKeys = queryKeysFactory(SELLER_MEMBERS_QUERY_KEY);

const SELLER_INVITES_QUERY_KEY = "seller_invites" as const;
export const sellerInvitesQueryKeys = queryKeysFactory(SELLER_INVITES_QUERY_KEY);

export const useSeller = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.sellers.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.sellers.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.sellers.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.sellers.$id.query({ $id: id, ...query }),
    queryKey: sellersQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useSellers = (
  query?: InferClientInput<typeof sdk.admin.sellers.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.sellers.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.sellers.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.sellers.query({
        ...query,
      }),
    queryKey: sellersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useSellerProducts = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.sellers.$id.products.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.sellers.$id.products.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.sellers.$id.products.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.sellers.$id.products.query({ $id: id, ...query }),
    queryKey: [...sellersQueryKeys.detail(id), "products", query],
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateSeller = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.sellers.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.sellers.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: sellersQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useInviteSeller = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.invite.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.sellers.invite.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.sellers.invite.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: sellersQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useSuspendSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.suspend.mutate>,
    ClientError,
    { reason?: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload?: { reason?: string }) =>
      sdk.admin.sellers.$id.suspend.mutate({ $id: id, reason: payload?.reason }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useApproveSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.approve.mutate>,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.sellers.$id.approve.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUnsuspendSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.unsuspend.mutate>,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.sellers.$id.unsuspend.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useTerminateSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.terminate.mutate>,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.sellers.$id.terminate.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUnterminateSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.unterminate.mutate>,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.sellers.$id.unterminate.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSeller = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.sellers.$id.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSellerAddress = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.address.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.sellers.$id.address.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.address.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSellerPaymentDetails = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.paymentDetails.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.sellers.$id.paymentDetails.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.paymentDetails.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateSellerProfessionalDetails = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.professionalDetails.mutate>,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.admin.sellers.$id.professionalDetails.mutate
      >,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.professionalDetails.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteSellerProfessionalDetails = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.professionalDetails.delete>,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.sellers.$id.professionalDetails.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: sellersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSellerMembers = (
  sellerId: string,
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, ClientError>, "queryKey" | "queryFn">,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.sellers.$id.members.query({ $id: sellerId, ...query }),
    queryKey: sellerMembersQueryKeys.list({ sellerId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInviteSellerMember = (
  sellerId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.members.invite.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.sellers.$id.members.invite.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.members.invite.mutate({
        $id: sellerId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellerMembersQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: sellerInvitesQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddSellerMember = (
  sellerId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.members.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.sellers.$id.members.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.sellers.$id.members.mutate({
        $id: sellerId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellerMembersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveSellerMember = (
  sellerId: string,
  memberId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.sellers.$id.members.$memberId.delete>,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.sellers.$id.members.$memberId.delete({
        $id: sellerId,
        $memberId: memberId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellerMembersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteSellerInvite = (
  sellerId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.sellers.$id.members.invites.$inviteId.delete
    >,
    ClientError,
    { invite_id: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ invite_id }) =>
      sdk.admin.sellers.$id.members.invites.$inviteId.delete({
        $id: sellerId,
        $inviteId: invite_id,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellerInvitesQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useResendSellerInvite = (
  sellerId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.admin.sellers.$id.members.invites.$inviteId.resend.mutate
    >,
    ClientError,
    { invite_id: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ invite_id }) =>
      sdk.admin.sellers.$id.members.invites.$inviteId.resend.mutate({
        $id: sellerId,
        $inviteId: invite_id,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: sellerInvitesQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSellerInvites = (
  sellerId: string,
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, ClientError>, "queryKey" | "queryFn">,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.sellers.$id.members.invites.query({
        $id: sellerId,
        ...query,
      }),
    queryKey: sellerInvitesQueryKeys.list({ sellerId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};
