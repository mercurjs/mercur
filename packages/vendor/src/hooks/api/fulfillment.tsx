import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { useMutation, UseMutationOptions } from "@tanstack/react-query"

import { queryKeysFactory } from "../../lib/query-key-factory"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { ordersQueryKeys } from "./orders"

const FULFILLMENTS_QUERY_KEY = "fulfillments" as const
export const fulfillmentsQueryKeys = queryKeysFactory(FULFILLMENTS_QUERY_KEY)

export const useCreateFulfillment = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillments.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.fulfillments.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.fulfillments.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelFulfillment = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillments.$id.cancel.mutate>,
    ClientError
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.fulfillments.$id.cancel.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCreateFulfillmentShipment = (
  fulfillmentId: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.fulfillments.$id.shipment.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.fulfillments.$id.shipment.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.fulfillments.$id.shipment.mutate({
        id: fulfillmentId,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
