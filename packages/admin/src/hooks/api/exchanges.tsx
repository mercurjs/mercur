import { ClientError } from "@mercurjs/client"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { ordersQueryKeys } from "./orders"
import { returnsQueryKeys } from "./returns"

const EXCHANGES_QUERY_KEY = "exchanges" as const
export const exchangesQueryKeys = queryKeysFactory(EXCHANGES_QUERY_KEY)

export const useExchange = (
  id: string,
  query?: HttpTypes.AdminExchangeListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminExchangeResponse,
      ClientError,
      HttpTypes.AdminExchangeResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.exchanges.$id.query({ $id: id, ...query }),
    queryKey: exchangesQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useExchanges = (
  query?: HttpTypes.AdminExchangeListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminExchangeListParams,
      ClientError,
      HttpTypes.AdminExchangeListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.exchanges.query({ ...query }),
    queryKey: exchangesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateExchange = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminCreateExchange
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateExchange) =>
      sdk.admin.exchanges.mutate(payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelExchange = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminExchangeResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.exchanges.$id.cancel.mutate({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddExchangeInboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminAddExchangeInboundItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddExchangeInboundItems) =>
      sdk.admin.exchanges.$id.inbound.items.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateExchangeInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminUpdateExchangeInboundItem & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateExchangeInboundItem & { actionId: string }) => {
      return sdk.admin.exchanges.$id.inbound.items.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveExchangeInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.inbound.items.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddExchangeInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminExchangeAddInboundShipping
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminExchangeAddInboundShipping) =>
      sdk.admin.exchanges.$id.inbound.shippingMethod.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateExchangeInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminExchangeUpdateInboundShipping
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminExchangeUpdateInboundShipping & { actionId: string }) =>
      sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteExchangeInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.inbound.shippingMethod.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddExchangeOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminAddExchangeOutboundItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddExchangeOutboundItems) =>
      sdk.admin.exchanges.$id.outbound.items.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateExchangeOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminUpdateExchangeOutboundItem & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateExchangeOutboundItem & { actionId: string }) => {
      return sdk.admin.exchanges.$id.outbound.items.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveExchangeOutboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.outbound.items.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddExchangeOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminExchangeAddOutboundShipping
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminExchangeAddOutboundShipping) =>
      sdk.admin.exchanges.$id.outbound.shippingMethod.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateExchangeOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminExchangeUpdateOutboundShipping
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminExchangeUpdateOutboundShipping & { actionId: string }) =>
      sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteExchangeOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.exchanges.$id.outbound.shippingMethod.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useExchangeConfirmRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminExchangeResponse,
    ClientError,
    HttpTypes.AdminRequestExchange
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminRequestExchange) =>
      sdk.admin.exchanges.$id.request.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelExchangeRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminExchangeResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.exchanges.$id.request.delete({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: exchangesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
