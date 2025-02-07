import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { AdminOrder } from "@mercurjs/http-client";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";

export const orderQueryKeys = queryKeysFactory("order");

export const useOrder = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, { order: AdminOrder }, QueryKey>,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => api.admin.adminGetOrdersId(id).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};
