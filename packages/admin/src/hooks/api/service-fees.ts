import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const SERVICE_FEES_QUERY_KEY = "service_fees" as const
export const serviceFeesQueryKeys = queryKeysFactory(SERVICE_FEES_QUERY_KEY)

const backendUrl = __BACKEND_URL__ ?? "/api"

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${backendUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }
  return res.json()
}

// Queries
export const useServiceFees = (
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null) params.set(key, String(val))
    })
  }
  const qs = params.toString()
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchApi<any>(`/admin/service-fees${qs ? `?${qs}` : ""}`),
    queryKey: serviceFeesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useServiceFee = (
  id: string,
  options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => fetchApi<any>(`/admin/service-fees/${id}`),
    queryKey: serviceFeesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useServiceFeeChangeLogs = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const params = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null) params.set(key, String(val))
    })
  }
  const qs = params.toString()
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchApi<any>(
        `/admin/service-fees/${id}/change-logs${qs ? `?${qs}` : ""}`
      ),
    queryKey: [...serviceFeesQueryKeys.detail(id), "change-logs"],
    ...options,
  })

  return { ...data, ...rest }
}

// Mutations
export const useCreateServiceFee = (
  options?: UseMutationOptions<any, Error, any>
) => {
  return useMutation({
    mutationFn: (payload: any) =>
      fetchApi<any>("/admin/service-fees", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateServiceFee = (
  id: string,
  options?: UseMutationOptions<any, Error, any>
) => {
  return useMutation({
    mutationFn: (payload: any) =>
      fetchApi<any>(`/admin/service-fees/${id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeactivateServiceFee = (
  id: string,
  options?: UseMutationOptions<any, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchApi<any>(`/admin/service-fees/${id}/deactivate`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteServiceFee = (
  id: string,
  options?: UseMutationOptions<any, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchApi<any>(`/admin/service-fees/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchServiceFeeRules = (
  id: string,
  options?: UseMutationOptions<any, Error, any>
) => {
  return useMutation({
    mutationFn: (payload: any) =>
      fetchApi<any>(`/admin/service-fees/${id}/rules`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

declare const __BACKEND_URL__: string | undefined
