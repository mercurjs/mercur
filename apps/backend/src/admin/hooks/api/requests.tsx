import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { AdminRequest, AdminReviewRequest } from "@mercurjs/http-client";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";

export const requestsQueryKeys = queryKeysFactory("requests");

export const useVendorRequests = (
  query?: Parameters<typeof api.admin.adminListRequests>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminListRequests>[0],
      Error,
      {
        requests: AdminRequest[];
        count?: number;
      },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: requestsQueryKeys.list(query),
    queryFn: () => api.admin.adminListRequests(query).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};

export const useVendorRequest = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, { request?: AdminRequest }, QueryKey>,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: requestsQueryKeys.detail(id),
    queryFn: () => api.admin.adminGetRequestById(id).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};

export const useReviewRequest = (
  options: UseMutationOptions<
    { id?: string; status?: string },
    Error,
    { id: string; payload: AdminReviewRequest }
  >,
) => {
  return useMutation({
    mutationFn: ({ id, payload }) =>
      api.admin.adminReviewRequestById(id, payload).then((res) => res.data),
    ...options,
  });
};
