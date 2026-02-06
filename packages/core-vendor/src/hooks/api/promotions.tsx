import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions
} from '@tanstack/react-query';

import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { VendorPromotionRuleValueParams } from '../../types/promotion';
import { campaignsQueryKeys } from './campaigns';

const PROMOTIONS_QUERY_KEY = 'promotions' as const;

export const promotionsQueryKeys = {
  ...queryKeysFactory(PROMOTIONS_QUERY_KEY),
  // TODO: handle invalidations properly
  listRules: (
    id: string | null,
    ruleType: string,
    query?: HttpTypes.AdminGetPromotionRuleParams
  ) => [PROMOTIONS_QUERY_KEY, id, ruleType, query],
  listRuleAttributes: (ruleType: string, promotionType?: string) => [
    PROMOTIONS_QUERY_KEY,
    ruleType,
    promotionType
  ],
  listRuleValues: (ruleType: string, ruleValue: string, query: VendorPromotionRuleValueParams) => [
    PROMOTIONS_QUERY_KEY,
    ruleType,
    ruleValue,
    query
  ]
};

export const usePromotion = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminPromotionResponse,
      FetchError,
      HttpTypes.AdminPromotionResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.detail(id),
    queryFn: async () =>
      fetchQuery(`/vendor/promotions/${id}`, {
        method: 'GET',
        query: { fields: '+status' }
      }),
    ...options
  });

  return { ...data, ...rest };
};

export const usePromotionRules = (
  id: string | null,
  ruleType: string,
  query?: HttpTypes.AdminGetPromotionRuleParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminGetPromotionRuleParams,
      FetchError,
      HttpTypes.AdminPromotionRuleListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  if (!id) {
    return {
      rules: [],
      isLoading: false
    };
  }

  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.listRules(id, ruleType, query),
    queryFn: async () =>
      fetchQuery(`/vendor/promotions/${id}/${ruleType}`, {
        method: 'GET',
        query: query as {
          [key: string]: string | number;
        }
      }),
    ...options
  });

  return { ...data, ...rest };
};

export const usePromotions = (
  query?: HttpTypes.AdminGetPromotionsParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminPromotionListResponse,
      FetchError,
      HttpTypes.AdminPromotionListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.list(query),
    queryFn: async () =>
      fetchQuery('/vendor/promotions', {
        method: 'GET',
        query: query as { [key: string]: string | number }
      }),
    ...options
  });

  return { ...data, ...rest };
};

export const usePromotionRuleAttributes = (
  ruleType: string,
  promotionType?: string,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminRuleAttributeOptionsListResponse,
      FetchError,
      HttpTypes.AdminRuleAttributeOptionsListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.listRuleAttributes(ruleType, promotionType),
    queryFn: async () =>
      fetchQuery(`/vendor/promotions/rule-attribute-options/${ruleType}`, {
        method: 'GET',
        query: {
          promotion_type: promotionType as string
        }
      }),
    ...options
  });

  return { ...data, ...rest };
};

export const usePromotionRuleValues = (
  ruleType: string,
  ruleValue: string,
  query?: VendorPromotionRuleValueParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminRuleValueOptionsListResponse,
      FetchError,
      HttpTypes.AdminRuleValueOptionsListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: promotionsQueryKeys.listRuleValues(ruleType, ruleValue, query || {}),
    queryFn: async () =>
      await fetchQuery(`/vendor/promotions/rule-value-options/${ruleType}/${ruleValue}`, {
        method: 'GET',
        query: {
          ...(query as {
            [key: string]: string | number;
          })
        }
      }),
    ...options
  });

  return { ...data, ...rest };
};

export const useDeletePromotion = (
  id: string,
  options?: UseMutationOptions<HttpTypes.DeleteResponse<'promotion'>, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/promotions/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.detail(id)
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useCreatePromotion = (
  options?: UseMutationOptions<
    HttpTypes.AdminPromotionResponse,
    FetchError,
    HttpTypes.AdminCreatePromotion & { status: 'active' | 'draft' | 'inactive' }
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery('/vendor/promotions', {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useUpdatePromotion = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPromotionResponse,
    FetchError,
    HttpTypes.AdminUpdatePromotion
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery(`/vendor/promotions/${id}`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details()
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists()
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useRemovePromotionFromCampaign = (
  promotionId: string,
  options?: UseMutationOptions<HttpTypes.AdminPromotionResponse, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/promotions/${promotionId}`, {
        method: 'POST',
        body: { campaign_id: null }
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.details()
      });
      queryClient.invalidateQueries({
        queryKey: campaignsQueryKeys.lists()
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const usePromotionAddRules = (
  id: string,
  ruleType: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPromotionResponse,
    FetchError,
    HttpTypes.BatchAddPromotionRulesReq
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery(`/vendor/promotions/${id}/${ruleType}/batch`, {
        method: 'POST',
        body: { create: payload.rules }
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

type BatchRemovePromotionRulesReq = {
  rules: string[];
};

export const usePromotionRemoveRules = (
  id: string,
  ruleType: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPromotionResponse,
    FetchError,
    BatchRemovePromotionRulesReq
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery(`/vendor/promotions/${id}/${ruleType}/batch`, {
        method: 'POST',
        body: { delete: payload.rules }
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const usePromotionUpdateRules = (
  id: string,
  ruleType: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPromotionResponse,
    FetchError,
    HttpTypes.BatchUpdatePromotionRulesReq
  >
) => {
  return useMutation({
    mutationFn: async payload => {
      const { rules } = await fetchQuery(`/vendor/promotions/${id}/${ruleType}`, {
        method: 'GET'
      });

      const rulesIds = rules.map((rule: any) => rule.id);
      await fetchQuery(`/vendor/promotions/${id}/${ruleType}/batch`, {
        method: 'POST',
        body: { delete: rulesIds }
      });

      return fetchQuery(`/vendor/promotions/${id}/${ruleType}/batch`, {
        method: 'POST',
        body: {
          create: payload.rules.map(rule => ({
            attribute: rule.attribute,
            operator: rule.operator,
            values: rule.values
          }))
        }
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
