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

const MEMBERS_QUERY_KEY = "members" as const;
export const membersQueryKeys = {
  ...queryKeysFactory(MEMBERS_QUERY_KEY),
  me: () => [MEMBERS_QUERY_KEY, "me"],
};

export const useMe = (
  options?: UseQueryOptions<
    any,
    ClientError,
    InferClientOutput<typeof sdk.vendor.members.me.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.members.me.query(),
    queryKey: membersQueryKeys.me(),
    ...options,
  });

  return {
    ...data,
    ...rest,
  };
};

export const useUpdateMe = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.members.me.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.members.me.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.members.me.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: membersQueryKeys.me() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSellerMembers = (
  sellerId: string,
  query?: Record<string, any>,
  options?: UseQueryOptions<any, ClientError>,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.sellers.$id.members.query({ $id: sellerId, ...query }),
    queryKey: membersQueryKeys.list({ sellerId, ...query }),
    ...options,
  });

  return {
    ...data,
    ...rest,
  };
};

export const useUpdateMemberRole = (
  sellerId: string,
  memberId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.members.$memberId.mutate>,
    ClientError,
    { role_id: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.sellers.$id.members.$memberId.mutate({
        $id: sellerId,
        $memberId: memberId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.lists(),
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
    InferClientOutput<typeof sdk.vendor.sellers.$id.members.$memberId.delete>,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.vendor.sellers.$id.members.$memberId.delete({
        $id: sellerId,
        $memberId: memberId,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: membersQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
