import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { customersQueryKeys } from "./customers"

const CUSTOMER_GROUPS_QUERY_KEY = "customer_groups" as const
export const customerGroupsQueryKeys = queryKeysFactory(
  CUSTOMER_GROUPS_QUERY_KEY
)

export const useCustomerGroup = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.customerGroups.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.customerGroups.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.customerGroups.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.customerGroups.$id.query({ $id: id, ...query }),
    queryKey: customerGroupsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCustomerGroups = (
  query?: InferClientInput<typeof sdk.admin.customerGroups.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.customerGroups.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.customerGroups.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.customerGroups.query({ ...query }),
    queryKey: customerGroupsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

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
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateCustomerGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.customerGroups.$id.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.customerGroups.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCustomerGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.customerGroups.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveCustomersFromGroup = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.customerGroups.$id.customers.mutate>,
    ClientError,
    HttpTypes.AdminBatchLink["remove"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.customerGroups.$id.customers.mutate({
        $id: id,
        remove: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCustomerGroupCustomers = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.customerGroups.$id.customers.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.customerGroups.$id.customers.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.customerGroups.$id.customers.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.customerGroups.$id.customers.query({ $id: id, ...query }),
    queryKey: customerGroupsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}
