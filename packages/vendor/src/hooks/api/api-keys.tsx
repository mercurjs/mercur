import { HttpTypes } from "@medusajs/types";
import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  MutationOptions,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { salesChannelsQueryKeys } from "./sales-channels";

const API_KEYS_QUERY_KEY = "api_keys" as const;
export const apiKeysQueryKeys = queryKeysFactory(API_KEYS_QUERY_KEY);

export const useApiKey = (
  id: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.apiKeys.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.apiKeys.$id.query({ id }),
    queryKey: apiKeysQueryKeys.detail(id),
    ...options,
  });

  return { data, ...rest };
};

export const useApiKeys = (
  query?: HttpTypes.AdminGetApiKeysParams,
  options?: UseQueryOptions<
    InferClientInput<typeof sdk.admin.apiKeys.query>,
    ClientError,
    InferClientOutput<typeof sdk.admin.apiKeys.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.apiKeys.query({ ...query }),
    queryKey: apiKeysQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateApiKey = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.apiKeys.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.apiKeys.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.apiKeys.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.apiKeys.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRevokeApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.revoke.mutate>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.apiKeys.$id.revoke.mutate({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useDeleteApiKey = (
  id: string,
  options?: MutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.apiKeys.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
  });
};

export const useBatchRemoveSalesChannelsFromApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.salesChannels.mutate>,
    ClientError,
    InferClientInput<
      typeof sdk.admin.apiKeys.$id.salesChannels.mutate
    >["remove"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.apiKeys.$id.salesChannels.mutate({ id, remove: payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchAddSalesChannelsToApiKey = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.apiKeys.$id.salesChannels.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.apiKeys.$id.salesChannels.mutate>["add"]
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.apiKeys.$id.salesChannels.mutate({ id, add: payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: salesChannelsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
