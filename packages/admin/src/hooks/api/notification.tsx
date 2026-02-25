import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const NOTIFICATION_QUERY_KEY = "notification" as const
export const notificationQueryKeys = queryKeysFactory(NOTIFICATION_QUERY_KEY)

export const useNotification = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.notifications.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.notifications.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.notifications.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: () => sdk.admin.notifications.$id.query({ $id: id, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useNotifications = (
  query?: InferClientInput<typeof sdk.admin.notifications.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.notifications.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.notifications.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.notifications.query({ ...query }),
    queryKey: notificationQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}
