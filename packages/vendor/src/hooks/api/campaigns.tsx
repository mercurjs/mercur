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
    InferClientInput<typeof sdk.admin.campaigns.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.campaigns.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: campaignsQueryKeys.detail(id),
    queryFn: async () => sdk.admin.campaigns.$id.query({ id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCampaigns = (
  query?: InferClientInput<typeof sdk.admin.campaigns.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.campaigns.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.campaigns.query({ ...query }),
    queryKey: campaignsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateCampaign = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.campaigns.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.campaigns.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.campaigns.mutate(payload),
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
    InferClientOutput<typeof sdk.admin.campaigns.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.campaigns.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.campaigns.$id.mutate({ id, ...payload }),
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
    InferClientOutput<typeof sdk.admin.campaigns.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.campaigns.$id.delete({ id }),
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
    InferClientOutput<typeof sdk.admin.campaigns.$id.promotions.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.campaigns.$id.promotions.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.campaigns.$id.promotions.mutate({ id, ...payload }),
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
