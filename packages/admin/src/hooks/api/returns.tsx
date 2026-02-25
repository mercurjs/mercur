import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { ClientError } from "@mercurjs/client"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { ordersQueryKeys } from "./orders"

const RETURNS_QUERY_KEY = "returns" as const
export const returnsQueryKeys = queryKeysFactory(RETURNS_QUERY_KEY)

export const useReturn = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, ClientError, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.returns.$id.query({ $id: id, ...query }),
    queryKey: returnsQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useReturns = (
  query?: HttpTypes.AdminReturnFilters,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminReturnFilters,
      ClientError,
      HttpTypes.AdminReturnsResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.returns.query({ ...query }),
    queryKey: returnsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useInitiateReturn = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminInitiateReturnRequest
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminInitiateReturnRequest) =>
      sdk.admin.returns.mutate(payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminReturnResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returns.$id.cancel.mutate({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * REQUEST RETURN
 */

export const useConfirmReturnRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminConfirmReturnRequest
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminConfirmReturnRequest) =>
      sdk.admin.returns.$id.request.mutate({ $id: id, ...payload }),
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
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelReturnRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminReturnResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returns.$id.request.delete({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminAddReturnItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddReturnItems) =>
      sdk.admin.returns.$id.requestItems.mutate({ $id: id, ...payload }),
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

export const useUpdateReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminUpdateReturnItems & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateReturnItems & { actionId: string }) => {
      return sdk.admin.returns.$id.requestItems.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
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

export const useRemoveReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.returns.$id.requestItems.$actionId.delete({
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

export const useUpdateReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminUpdateReturnRequest
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateReturnRequest) => {
      return sdk.admin.returns.$id.mutate({ $id: id, ...payload })
    },
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

export const useAddReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminAddReturnShipping
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddReturnShipping) =>
      sdk.admin.returns.$id.shippingMethod.mutate({ $id: id, ...payload }),
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

export const useUpdateReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminAddReturnShipping
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminAddReturnShipping & { actionId: string }) =>
      sdk.admin.returns.$id.shippingMethod.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
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

export const useDeleteReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.returns.$id.shippingMethod.$actionId.delete({
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

/**
 * RECEIVE RETURN
 */

export const useInitiateReceiveReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminInitiateReceiveReturn
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminInitiateReceiveReturn) =>
      sdk.admin.returns.$id.receive.mutate({ $id: id, ...payload }),
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

export const useAddReceiveItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminReceiveItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminReceiveItems) =>
      sdk.admin.returns.$id.receiveItems.mutate({ $id: id, ...payload }),
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

export const useUpdateReceiveItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminUpdateReceiveItems & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateReceiveItems & { actionId: string }) => {
      return sdk.admin.returns.$id.receiveItems.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
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

export const useRemoveReceiveItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) => {
      return sdk.admin.returns.$id.receiveItems.$actionId.delete({
        $id: id,
        $actionId: actionId,
      })
    },
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

export const useAddDismissItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminDismissItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminDismissItems) =>
      sdk.admin.returns.$id.dismissItems.mutate({ $id: id, ...payload }),
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

export const useUpdateDismissItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminUpdateDismissItems & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateReceiveItems & { actionId: string }) => {
      return sdk.admin.returns.$id.dismissItems.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
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

export const useRemoveDismissItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) => {
      return sdk.admin.returns.$id.dismissItems.$actionId.delete({
        $id: id,
        $actionId: actionId,
      })
    },
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

export const useConfirmReturnReceive = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    HttpTypes.AdminConfirmReceiveReturn
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminConfirmReceiveReturn) =>
      sdk.admin.returns.$id.receive.confirm.mutate({ $id: id, ...payload }),
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
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelReceiveReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminReturnResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.returns.$id.receive.delete({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
