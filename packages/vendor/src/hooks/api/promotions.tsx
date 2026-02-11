import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { sdk, fetchQuery } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { campaignsQueryKeys } from "./campaigns";
import {
  ApplicationMethodTargetTypeValues,
  PromotionTypeValues,
} from "@medusajs/types";

const PROMOTIONS_QUERY_KEY = "promotions" as const;
export const promotionsQueryKeys = {
  ...queryKeysFactory(PROMOTIONS_QUERY_KEY),
  listRules: (
    id: string | null,
    ruleType: string,
    query?: Record<string, unknown>
  ) => [PROMOTIONS_QUERY_KEY, id, ruleType, query],
  listRuleAttributes: (
    ruleType: string,
    promotionType?: string,
    applicationMethodTargetType?: string
  ) => [
    PROMOTIONS_QUERY_KEY,
    ruleType,
    promotionType,
    applicationMethodTargetType,
  ],
  listRuleValues: (
    ruleType: string,
    ruleValue: string,
    query?: Record<string, unknown>
  ) => [PROMOTIONS_QUERY_KEY, ruleType, ruleValue, query],
};

export const usePromotion = (
  id: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.promotions.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.detail(id),
    queryFn: async () => sdk.vendor.promotions.$id.query({ id }),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePromotionRules = (
  id: string | null,
  ruleType: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.promotions.$id.$ruleType.query>,
    "id" | "ruleType"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.promotions.$id.$ruleType.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.listRules(id, ruleType, query),
    queryFn: async () =>
      sdk.vendor.promotions.$id.$ruleType.query({
        id: id!,
        ruleType,
        ...query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePromotions = (
  query?: InferClientInput<typeof sdk.vendor.promotions.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.promotions.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.list(query),
    queryFn: async () => sdk.vendor.promotions.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePromotionRuleAttributes = (
  ruleType: string,
  promotionType?: string,
  applicationMethodTargetType?: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<
      typeof sdk.vendor.promotions.ruleAttributeOptions.$ruleType.query
    >
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.listRuleAttributes(
      ruleType,
      promotionType,
      applicationMethodTargetType
    ),
    queryFn: async () =>
      sdk.vendor.promotions.ruleAttributeOptions.$ruleType.query({
        ruleType,
        promotion_type: promotionType as PromotionTypeValues,
        application_method_target_type:
          applicationMethodTargetType as ApplicationMethodTargetTypeValues,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePromotionRuleValues = (
  ruleType: string,
  ruleValue: string,
  query?: Omit<
    InferClientInput<
      typeof sdk.vendor.promotions.ruleValueOptions.$ruleType.$ruleAttributeId.query
    >,
    "ruleType" | "ruleAttributeId"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<
      typeof sdk.vendor.promotions.ruleValueOptions.$ruleType.$ruleAttributeId.query
    >
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.listRuleValues(
      ruleType,
      ruleValue,
      query || {}
    ),
    queryFn: async () =>
      sdk.vendor.promotions.ruleValueOptions.$ruleType.$ruleAttributeId.query({
        ruleType,
        ruleAttributeId: ruleValue,
        ...query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useDeletePromotion = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.promotions.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.promotions.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreatePromotion = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.promotions.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.promotions.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.promotions.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdatePromotion = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.promotions.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.promotions.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.promotions.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePromotionAddRules = (
  id: string,
  ruleType: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.promotions.$id.rules.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.promotions.$id.rules.batch.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      if (ruleType === "buy-rules") {
        return sdk.vendor.promotions.$id.buyRules.batch.mutate({
          id,
          ...payload,
        });
      }
      if (ruleType === "target-rules") {
        return sdk.vendor.promotions.$id.targetRules.batch.mutate({
          id,
          ...payload,
        });
      }
      return sdk.vendor.promotions.$id.rules.batch.mutate({ id, ...payload });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePromotionRemoveRules = (
  id: string,
  ruleType: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.promotions.$id.rules.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.promotions.$id.rules.batch.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      if (ruleType === "buy-rules") {
        return sdk.vendor.promotions.$id.buyRules.batch.mutate({
          id,
          ...payload,
        });
      }
      if (ruleType === "target-rules") {
        return sdk.vendor.promotions.$id.targetRules.batch.mutate({
          id,
          ...payload,
        });
      }
      return sdk.vendor.promotions.$id.rules.batch.mutate({ id, ...payload });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePromotionUpdateRules = (
  id: string,
  ruleType: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.promotions.$id.rules.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.promotions.$id.rules.batch.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      if (ruleType === "buy-rules") {
        return sdk.vendor.promotions.$id.buyRules.batch.mutate({
          id,
          ...payload,
        });
      }
      if (ruleType === "target-rules") {
        return sdk.vendor.promotions.$id.targetRules.batch.mutate({
          id,
          ...payload,
        });
      }
      return sdk.vendor.promotions.$id.rules.batch.mutate({ id, ...payload });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRemovePromotionFromCampaign = (
  promotionId: string,
  options?: UseMutationOptions<any, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/promotions/${promotionId}`, {
        method: "POST",
        body: { campaign_id: null },
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
