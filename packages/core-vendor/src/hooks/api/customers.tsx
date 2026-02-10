import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes, PaginatedResponse } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery, sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { customerGroupsQueryKeys } from "./customer-groups"
import { filterOrders } from "@pages/orders/common/orderFiltering"
import { processCustomers } from "../../utils/customer-filtering"

const CUSTOMERS_QUERY_KEY = "customers" as const
export const customersQueryKeys = queryKeysFactory(CUSTOMERS_QUERY_KEY)

export const useCustomer = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { customer: HttpTypes.AdminCustomer },
      FetchError,
      { customer: HttpTypes.AdminCustomer },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: customersQueryKeys.detail(id),
    queryFn: async () =>
      fetchQuery(`/vendor/customers/${id}`, {
        method: "GET",
        query,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCustomers = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{
        customers: HttpTypes.AdminCustomer[]
      }>,
      FetchError,
      PaginatedResponse<{
        customers: HttpTypes.AdminCustomer[]
      }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
  filters?: any
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/customers", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    queryKey: customersQueryKeys.list(query),
    ...options,
  })

  const processedCustomers = processCustomers(data?.customers, filters || {})
  const count = processedCustomers?.length || 0

  return {
    ...data,
    customers: processedCustomers,
    count,
    ...rest,
  }
}

export const useCreateCustomer = (
  options?: UseMutationOptions<
    { customer: HttpTypes.AdminCustomer },
    FetchError,
    HttpTypes.AdminCreateCustomer
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.customer.create(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateCustomer = (
  id: string,
  options?: UseMutationOptions<
    { customer: HttpTypes.AdminCustomer },
    FetchError,
    HttpTypes.AdminUpdateCustomer
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.customer.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCustomer = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.customer.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchCustomerCustomerGroups = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerResponse,
    FetchError,
    HttpTypes.AdminBatchLink
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/customers/${id}/customer-groups`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCustomerOrders = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { orders: HttpTypes.AdminOrder[] },
      FetchError,
      { orders: HttpTypes.AdminOrder[] },
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
  })

  const filteredOrders = filterOrders(data?.orders, filters, filters.sort)

  return { ...data, orders: filteredOrders, ...rest }
}
