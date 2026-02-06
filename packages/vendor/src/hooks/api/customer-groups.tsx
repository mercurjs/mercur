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
import { customersQueryKeys } from "./customers";

const CUSTOMER_GROUPS_QUERY_KEY = "customer_groups" as const;
export const customerGroupsQueryKeys = queryKeysFactory(
  CUSTOMER_GROUPS_QUERY_KEY
);

export const useCustomerGroup = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.customerGroups.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.customerGroups.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: customerGroupsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.customerGroups.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCustomerGroups = (
  query?: InferClientInput<typeof sdk.admin.customerGroups.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.customerGroups.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.customerGroups.query({ ...query }),
    queryKey: customerGroupsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateCustomerGroup = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.customerGroups.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.customerGroups.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCustomerGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.customerGroups.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.customerGroups.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCustomerGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.customerGroups.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCustomerGroupLazy = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.delete>,
    ClientError,
    { id: string }
  >
) => {
  return useMutation({
    mutationFn: ({ id }) => sdk.admin.customerGroups.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(variables.id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddCustomersToGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.customers.mutate>,
    ClientError,
    InferClientInput<
      typeof sdk.admin.customerGroups.$id.customers.mutate
    >["add"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.customerGroups.$id.customers.mutate({ id, add: payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemoveCustomersFromGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.customers.mutate>,
    ClientError,
    InferClientInput<
      typeof sdk.admin.customerGroups.$id.customers.mutate
    >["remove"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.customerGroups.$id.customers.mutate({ id, remove: payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
