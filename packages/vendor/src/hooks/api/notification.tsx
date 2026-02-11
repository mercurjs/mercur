import { UseQueryOptions, useQuery } from "@tanstack/react-query";

import { fetchQuery } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const NOTIFICATION_QUERY_KEY = "notification" as const;
export const notificationQueryKeys = queryKeysFactory(NOTIFICATION_QUERY_KEY);

export const useNotification = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, Error, any>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: async () =>
      fetchQuery(`/vendor/notifications/${id}`, {
        method: "GET",
        query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useNotifications = (
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, Error, any>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/notifications`, {
        method: "GET",
        query,
      }),
    queryKey: notificationQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};
