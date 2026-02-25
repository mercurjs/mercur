import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { HttpTypes } from "@medusajs/types"
import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { ordersQueryKeys } from "./orders"
import { reservationItemsQueryKeys } from "./reservations"
import { inventoryItemsQueryKeys } from "./inventory.tsx"

export const useCreateOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    HttpTypes.AdminInitiateOrderEditRequest
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminInitiateOrderEditRequest) =>
      sdk.admin.orderEdits.mutate(payload),
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

export const useRequestOrderEdit = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orderEdits.$id.request.mutate({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(id),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lineItems(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useConfirmOrderEdit = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orderEdits.$id.confirm.mutate({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(id),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lineItems(id),
      })

      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelOrderEdit = (
  orderId: string,
  options?: UseMutationOptions<any, ClientError, any>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.orderEdits.$id.request.delete({ $id: orderId }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lineItems(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddOrderEditItems = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    HttpTypes.AdminAddOrderEditItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddOrderEditItems) =>
      sdk.admin.orderEdits.$id.items.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * Update (quantity) of an item that was originally on the order.
 */
export const useUpdateOrderEditOriginalItem = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    HttpTypes.AdminUpdateOrderEditItem & { itemId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      itemId,
      ...payload
    }: HttpTypes.AdminUpdateOrderEditItem & { itemId: string }) => {
      return sdk.admin.orderEdits.$id.items.item.$itemId.mutate({
        $id: id,
        $itemId: itemId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * Update (quantity) of an item that was added to the order edit.
 */
export const useUpdateOrderEditAddedItem = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    HttpTypes.AdminUpdateOrderEditItem & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateOrderEditItem & { actionId: string }) => {
      return sdk.admin.orderEdits.$id.items.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * Remove item that was added to the edit.
 * To remove an original item on the order, set quantity to 0.
 */
export const useRemoveOrderEditItem = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderEditPreviewResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.orderEdits.$id.items.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
