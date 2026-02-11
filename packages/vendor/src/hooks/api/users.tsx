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
import { sdk, fetchQuery } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const USERS_QUERY_KEY = "users" as const;
const usersQueryKeys = {
  ...queryKeysFactory(USERS_QUERY_KEY),
  me: () => [USERS_QUERY_KEY, "me"],
};

export const useMe = (
  query?: Omit<InferClientInput<typeof sdk.vendor.sellers.me.query>, "$id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.sellers.me.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.sellers.me.query({ ...query }),
    queryKey: usersQueryKeys.me(),
    ...options,
  });

  return {
    ...data,
    ...rest,
  };
};

export const useUser = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.vendor.users.$id.query>, "$id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.users.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.users.$id.query({ $id: id, ...query }),
    queryKey: usersQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUsers = (
  query?: InferClientInput<typeof sdk.vendor.users.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.users.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.users.query({ ...query }),
    queryKey: usersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateUser = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.users.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.users.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.users.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });

      // We invalidate the me query in case the user updates their own profile
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.me() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteUser = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.users.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.users.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });

      // We invalidate the me query in case the user updates their own profile
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.me() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUserMe = (
  query?: Record<string, any>,
  options?: UseQueryOptions<any, Error, any>
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.sellers.me.query({ ...query }),
    queryKey: usersQueryKeys.me(),
    ...options,
  });

  return { ...data, ...rest };
};
