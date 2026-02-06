import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const NOTIFICATION_QUERY_KEY = "notification" as const;
export const notificationQueryKeys = queryKeysFactory(NOTIFICATION_QUERY_KEY);

export const useNotification = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.notifications.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.notifications.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: async () => sdk.admin.notifications.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useNotifications = (
  query?: InferClientInput<typeof sdk.admin.notifications.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.notifications.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.notifications.query({ ...query }),
    queryKey: notificationQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};
