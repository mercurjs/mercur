import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { promotionsQueryKeys } from "./promotions";

const REGIONS_QUERY_KEY = "campaigns" as const;
export const campaignsQueryKeys = queryKeysFactory(REGIONS_QUERY_KEY);

export const useCampaign = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.campaigns.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.campaigns.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: campaignsQueryKeys.detail(id),
    queryFn: async () => sdk.vendor.campaigns.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCampaigns = (
  query?: InferClientInput<typeof sdk.vendor.campaigns.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.campaigns.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.campaigns.query({ ...query }),
    queryKey: campaignsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateCampaign = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.campaigns.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.campaigns.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.campaigns.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCampaign = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.campaigns.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.campaigns.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.campaigns.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      });
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCampaign = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.campaigns.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.campaigns.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAddOrRemoveCampaignPromotions = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.campaigns.$id.promotions.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.campaigns.$id.promotions.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.campaigns.$id.promotions.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      });
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.details(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
