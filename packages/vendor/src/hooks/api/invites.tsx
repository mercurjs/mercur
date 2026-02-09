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
const invitesQueryKeys = queryKeysFactory(INVITES_QUERY_KEY);

export const useInvite = (
  id: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.invites.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: invitesQueryKeys.detail(id),
    queryFn: async () => sdk.admin.invites.$id.query({ id }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInvites = (
  query?: InferClientInput<typeof sdk.admin.invites.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.invites.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.invites.query({ ...query }),
    queryKey: invitesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateInvite = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.invites.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.invites.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.invites.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useResendInvite = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.invites.$id.resend.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.invites.$id.resend.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitesQueryKeys.detail(id) });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteInvite = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.invites.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.invites.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invitesQueryKeys.detail(id) });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAcceptInvite = (
  inviteToken: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.invites.accept.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.invites.accept.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      return sdk.admin.invites.accept.mutate({
        ...payload,
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${inviteToken}`,
          },
        },
      });
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
