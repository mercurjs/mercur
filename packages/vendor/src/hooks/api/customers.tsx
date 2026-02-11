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
import { sdk, fetchQuery } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { customerGroupsQueryKeys } from "./customer-groups";
import { filterOrders } from "../../pages/orders/common/orderFiltering";

const CUSTOMERS_QUERY_KEY = "customers" as const;
export const customersQueryKeys = queryKeysFactory(CUSTOMERS_QUERY_KEY);
export const customerAddressesQueryKeys = queryKeysFactory(
  `${CUSTOMERS_QUERY_KEY}-addresses`
);

export const useCustomer = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.vendor.customers.$id.query>, "id">,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.customers.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: customersQueryKeys.detail(id),
    queryFn: async () => sdk.vendor.customers.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCustomers = (
  query?: InferClientInput<typeof sdk.vendor.customers.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.customers.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.customers.query({ ...query }),
    queryKey: customersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateCustomer = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.customers.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.customers.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.customers.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCustomer = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.customers.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.customers.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.customers.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCustomer = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.customers.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.customers.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchCustomerCustomerGroups = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.customers.$id.customerGroups.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.customers.$id.customerGroups.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.customers.$id.customerGroups.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateCustomerAddress = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.customers.$id.addresses.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.customers.$id.addresses.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.customers.$id.addresses.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customerAddressesQueryKeys.list(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCustomerAddress = (
  id: string,
  addressId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.customers.$id.addresses.$addressId.mutate
    >,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.vendor.customers.$id.addresses.$addressId.mutate
      >,
      "id" | "addressId"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.customers.$id.addresses.$addressId.mutate({
        id,
        addressId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customerAddressesQueryKeys.list(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCustomerAddress = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.customers.$id.addresses.$addressId.delete
    >,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (addressId: string) =>
      sdk.vendor.customers.$id.addresses.$addressId.delete({ id, addressId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customerAddressesQueryKeys.list(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useListCustomerAddresses = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.customers.$id.addresses.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.customers.$id.addresses.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.customers.$id.addresses.query({ id, ...query }),
    queryKey: customerAddressesQueryKeys.list(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCustomerAddress = (
  id: string,
  addressId: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<
      typeof sdk.vendor.customers.$id.addresses.$addressId.query
    >
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.customers.$id.addresses.$addressId.query({ id, addressId }),
    queryKey: customerAddressesQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCustomerOrders = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { orders: any[] },
      Error,
      { orders: any[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
  filters?: any
) => {
  const { data, ...rest } = useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, id, "orders"],
    queryFn: async () =>
      fetchQuery(`/vendor/customers/${id}/orders`, {
        method: "GET",
        query,
      }),
    ...options,
  });

  const filteredOrders = filterOrders(data?.orders, filters, filters?.sort);

  return { ...data, orders: filteredOrders, ...rest };
};
