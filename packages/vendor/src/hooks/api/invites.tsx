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

const INVITES_QUERY_KEY = "invites" as const;
export const invitesQueryKeys = queryKeysFactory(INVITES_QUERY_KEY);

export const useInvites = (
  sellerId: string,
  query?: Record<string, any>,
  options?: UseQueryOptions<any, ClientError>,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.sellers.$id.members.invites.query({
        $id: sellerId,
        ...query,
      }),
    queryKey: invitesQueryKeys.list({ sellerId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useAcceptInvite = (
  options?: UseMutationOptions<
    any,
    ClientError,
    { invite_token: string; auth_token: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.members.invites.accept.mutate({
        invite_token: payload.invite_token,
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${payload.auth_token}`,
          },
        },
      }),
    ...options,
  });
};

export const useCreateInvite = (
  sellerId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.sellers.$id.members.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.sellers.$id.members.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.sellers.$id.members.mutate({ $id: sellerId, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
