import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const ORDER_GROUPS_QUERY_KEY = "order_groups" as const
export const orderGroupsQueryKeys = queryKeysFactory(ORDER_GROUPS_QUERY_KEY)

export const useOrderGroup = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.orderGroups.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.orderGroups.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.orderGroups.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.orderGroups.$id.query({ $id: id, ...query }),
    queryKey: orderGroupsQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrderGroupByOrderId = (
  orderId: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.orders.$id.orderGroup.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.orders.$id.orderGroup.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.orders.$id.orderGroup.query({ $id: orderId, ...query }),
    queryKey: orderGroupsQueryKeys.detail(`order-${orderId}`),
    ...options,
  })

  return { ...data, ...rest }
}

export const useOrderGroups = (
  query?: InferClientInput<typeof sdk.admin.orderGroups.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.orderGroups.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.orderGroups.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.orderGroups.query({ ...query }),
    queryKey: orderGroupsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}
