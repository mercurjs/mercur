import { ClientError } from "@mercurjs/client"
import { CreateOrderCreditLineDTO, HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory, TQueryKey } from "../../lib/query-key-factory"
import { inventoryItemsQueryKeys } from "./inventory"
import { reservationItemsQueryKeys } from "./reservations"

const ORDERS_QUERY_KEY = "orders" as const
const _orderKeys = queryKeysFactory(ORDERS_QUERY_KEY) as TQueryKey<"orders"> & {
  preview: (orderId: string) => any
  changes: (orderId: string) => any
  lineItems: (orderId: string) => any
  shippingOptions: (orderId: string) => any
}

_orderKeys.preview = function (id: string) {
  return [this.detail(id), "preview"]
}

_orderKeys.changes = function (id: string) {
  return [this.detail(id), "changes"]
}

_orderKeys.lineItems = function (id: string) {
  return [this.detail(id), "lineItems"]
}

_orderKeys.shippingOptions = function (id: string) {
  return [this.detail(id), "shippingOptions"]
}

export const ordersQueryKeys = _orderKeys

export const useOrder = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, ClientError, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.orders.$id.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateOrder = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    HttpTypes.AdminUpdateOrder
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateOrder) =>
      sdk.admin.orders.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(id),
      })

      // TODO: enable when needed
      // queryClient.invalidateQueries({
      //   queryKey: ordersQueryKeys.lists(),
      // })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useOrderPreview = (
  id: string,
  query?: HttpTypes.AdminOrderFilters,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminOrderPreviewResponse,
      ClientError,
      HttpTypes.AdminOrderPreviewResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.preview.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.preview(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrders = (
  query?: HttpTypes.AdminOrderFilters,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminOrderListResponse,
      ClientError,
      HttpTypes.AdminOrderListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.orders.query({ ...query }),
    queryKey: ordersQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrderShippingOptions = (
  id: string,
  query?: HttpTypes.AdminGetOrderShippingOptionList,
  options?: Omit<
    UseQueryOptions<
      { shipping_options: HttpTypes.AdminShippingOption[] },
      ClientError,
      { shipping_options: HttpTypes.AdminShippingOption[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.shippingOptions.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.shippingOptions(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrderChanges = (
  id: string,
  query?: HttpTypes.AdminOrderChangesFilters,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminOrderChangesResponse,
      ClientError,
      HttpTypes.AdminOrderChangesResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.changes.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.changes(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrderLineItems = (
  id: string,
  query?: HttpTypes.AdminOrderItemsFilters,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminOrderLineItemsListResponse,
      ClientError,
      HttpTypes.AdminOrderLineItemsListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.lineItems.query({ $id: id, ...query }),
    queryKey: ordersQueryKeys.lineItems(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateOrderFulfillment = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    HttpTypes.AdminCreateOrderFulfillment
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateOrderFulfillment) =>
      sdk.admin.orders.$id.fulfillments.mutate({ $id: orderId, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelOrderFulfillment = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<any, ClientError, any>
) => {
  return useMutation({
    mutationFn: (payload: { no_notification?: boolean }) =>
      sdk.admin.orders.$id.fulfillments.$fulfillmentId.cancel.mutate({
        $id: orderId,
        $fulfillmentId: fulfillmentId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: reservationItemsQueryKeys.lists(),
      })

      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCreateOrderShipment = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<
    { order: HttpTypes.AdminOrder },
    ClientError,
    HttpTypes.AdminCreateOrderShipment
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateOrderShipment) =>
      sdk.admin.orders.$id.fulfillments.$fulfillmentId.shipments.mutate({
        $id: orderId,
        $fulfillmentId: fulfillmentId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useMarkOrderFulfillmentAsDelivered = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<
    { order: HttpTypes.AdminOrder },
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.orders.$id.fulfillments.$fulfillmentId.markAsDelivered.mutate({
        $id: orderId,
        $fulfillmentId: fulfillmentId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelOrder = (
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminOrderResponse, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.orders.$id.cancel.mutate({ $id: orderId }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRequestTransferOrder = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    HttpTypes.AdminRequestOrderTransfer
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminRequestOrderTransfer) =>
      sdk.admin.orders.$id.transfer.mutate({ $id: orderId, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelOrderTransfer = (
  orderId: string,
  options?: UseMutationOptions<any, ClientError, void>
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.orders.$id.transfer.cancel.mutate({ $id: orderId }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.changes(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCreateOrderCreditLine = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminOrderResponse,
    ClientError,
    Omit<CreateOrderCreditLineDTO, "order_id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.orders.$id.creditLines.mutate({ $id: orderId, ...payload }),
    onSuccess: (data, variables, context) => {
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
