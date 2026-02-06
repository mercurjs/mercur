import { FetchError } from "@medusajs/js-sdk"
import { PaginatedResponse } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"

const REQUESTS_QUERY_KEY = "requests" as const
export const requestsQueryKeys = queryKeysFactory(REQUESTS_QUERY_KEY)

export const useRequest = (
  id: string,
  query?: { [key: string]: string | number },
  options?: Omit<
    UseQueryOptions<
      {
        request: any
      },
      FetchError,
      {
        request: any
      },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: requestsQueryKeys.detail(id),
    queryFn: async () =>
      fetchQuery(`/vendor/requests/${id}`, {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useRequests = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{
        requests: any
      }>,
      FetchError,
      PaginatedResponse<{
        requests: any
      }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/requests", {
        method: "GET",
        query: query as { [key: string]: string | number },
      }),

    queryKey: [REQUESTS_QUERY_KEY, "list"],
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateVendorRequest = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/requests", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [REQUESTS_QUERY_KEY, "list"],
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateRequest = (
  id: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/requests/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [REQUESTS_QUERY_KEY, "list"],
      })

      queryClient.invalidateQueries({
        queryKey: requestsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateOrderReturnRequest = (id: string) => {
  return useMutation({
    mutationFn: (payload: any) =>
      fetchQuery(`/vendor/return-request/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REQUESTS_QUERY_KEY, "return-request", id],
      })

      queryClient.invalidateQueries({
        queryKey: [REQUESTS_QUERY_KEY, "return-requests"],
      })
    },
  })
}

export const useOrderReturnRequest = (
  id: string,
  options?: UseQueryOptions<any, FetchError, any>
) => {
  const { data, ...rest } = useQuery({
    queryKey: [REQUESTS_QUERY_KEY, "return-request", id],
    queryFn: () =>
      fetchQuery(`/vendor/return-request/${id}`, {
        method: "GET",
        query: { fields: "*order" },
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrderReturnRequests = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{
        order_return_request: any
      }>,
      FetchError,
      PaginatedResponse<{
        order_return_request: any
      }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/return-request", {
        method: "GET",
        query: {
          fields: "*order.customer,+created_at",
        },
      }),

    queryKey: [REQUESTS_QUERY_KEY, "return-requests"],
    ...options,
  })

  let processedData = data?.order_return_request

  if (query?.limit) {
    processedData = data?.order_return_request.slice(0, Number(query.limit))
  }

  if (query?.offset) {
    processedData = data?.order_return_request.slice(
      Number(query.offset),
      Number(query.offset) + Number(query.limit)
    )
  }

  return {
    order_return_request: processedData,
    count: data?.count || 0,
    ...rest,
  }
}
