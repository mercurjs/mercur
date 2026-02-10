import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { customersQueryKeys } from "./customers"
import { filterCustomerGroups } from "@pages/orders/common/customerGroupFiltering"
import { CustomerGroupListResponse } from "../../types/customer-group"

const CUSTOMER_GROUPS_QUERY_KEY = "customer_groups" as const
export const customerGroupsQueryKeys = queryKeysFactory(
  CUSTOMER_GROUPS_QUERY_KEY
)

export const useCustomerGroup = (
  id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminCustomerGroupResponse,
      FetchError,
      HttpTypes.AdminCustomerGroupResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: customerGroupsQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(`/vendor/customer-groups/${id}`, {
        method: "GET",
        query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCustomerGroups = (
  query?: HttpTypes.AdminGetCustomerGroupsParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminGetCustomerGroupsParams,
      FetchError,
      CustomerGroupListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
  filters?: any
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/customer-groups", {
        method: "GET",
      }),
    queryKey: customerGroupsQueryKeys.list(query),
    ...options,
  })
  
  const filteredData = filterCustomerGroups(
    data?.customer_groups,
    filters,
    filters?.sort
  )

  const customer_groups = filteredData?.filter((item) => item.customer_group)

  const count = customer_groups?.length || 0

  return {
    ...rest,
    count,
    customer_groups,
    offset: data?.offset,
    limit: data?.limit,
  }
}

export const useCreateCustomerGroup = (
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerGroupResponse,
    FetchError,
    HttpTypes.AdminCreateCustomerGroup
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/customer-groups", {
        method: "POST",
        body: payload,
      }),
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
    HttpTypes.AdminCustomerGroupResponse,
    FetchError,
    HttpTypes.AdminUpdateCustomerGroup
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/customer-groups/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCustomerGroup = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerGroupDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/customer-groups/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCustomerGroupLazy = (
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerGroupDeleteResponse,
    FetchError,
    { id: string }
  >
) => {
  return useMutation({
    mutationFn: ({ id }) =>
      fetchQuery(`/vendor/customer-groups/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.detail(variables.id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddCustomersToGroup = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerGroupResponse,
    FetchError,
    HttpTypes.AdminBatchLink["add"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/customer-groups/${id}/customers`, {
        method: "POST",
        body: { add: payload },
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

export const useRemoveCustomersFromGroup = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerGroupResponse,
    FetchError,
    HttpTypes.AdminBatchLink["remove"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/customer-groups/${id}/customers`, {
        method: "POST",
        body: { remove: payload },
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
