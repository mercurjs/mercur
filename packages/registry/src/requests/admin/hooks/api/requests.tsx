import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeysFactory } from "@mercurjs/dashboard-shared";
import { client } from "../../lib/client";
import {
  ClientError,
  InferClientOutput,
} from "@mercurjs/client";

const REQUESTS_QUERY_KEY = "admin_requests" as const;
export const requestsQueryKeys = queryKeysFactory(REQUESTS_QUERY_KEY);

export type RequestDTO = InferClientOutput<
  typeof client.admin.requests.$type.$id.query
>["request"];

export const useRequests = (
  type: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.admin.requests.$type.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: requestsQueryKeys.list({ type, ...query }),
    queryFn: async () =>
      client.admin.requests.$type.query({
        $type: type,
        ...query,
        offset: query?.offset ?? 0,
        limit: query?.limit ?? 20,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRequest = (
  type: string,
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof client.admin.requests.$type.$id.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: requestsQueryKeys.detail(id, { type, ...query }),
    queryFn: async () =>
      client.admin.requests.$type.$id.query({
        $type: type,
        $id: id,
        ...query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useAcceptRequest = (
  type: string,
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof client.admin.requests.$type.$id.accept.mutate>,
    ClientError,
    { reviewer_note?: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { reviewer_note?: string }) =>
      client.admin.requests.$type.$id.accept.mutate({
        $type: type,
        $id: id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRejectRequest = (
  type: string,
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof client.admin.requests.$type.$id.reject.mutate>,
    ClientError,
    { reviewer_note?: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { reviewer_note?: string }) =>
      client.admin.requests.$type.$id.reject.mutate({
        $type: type,
        $id: id,
        ...payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
