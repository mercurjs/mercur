import type { FetchError } from "@medusajs/js-sdk";

import { sdk } from "@lib/client";
import { queryKeysFactory } from "@lib/query-key-factory";
import {
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  AttributeDTO,
  AttributePossibleValueDTO,
  AttributesResponse,
} from "@custom-types/attribute";

const ATTRIBUTE_QUERY_KEY = "attribute" as const;
export const attributeQueryKeys = queryKeysFactory(ATTRIBUTE_QUERY_KEY);

export const useAttributes = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      {
        attributes: AttributeDTO[];
        count: number;
        offset: number;
        limit: number;
      },
      FetchError,
      {
        attributes: AttributeDTO[];
        count: number;
        offset: number;
        limit: number;
      },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributeQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch<AttributesResponse>("/admin/attributes", {
        method: "GET",
        query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useAttribute = (
  id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      { attribute: AttributeDTO },
      FetchError,
      { attribute: AttributeDTO },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributeQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch<{ attribute: AttributeDTO }>(`/admin/attributes/${id}`, {
        method: "GET",
        query,
      }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateAttribute = (
  id: string,
  options?: UseMutationOptions<
    { attribute: AttributeDTO },
    FetchError,
    Partial<Pick<AttributeDTO, "name" | "handle" | "description" | "metadata">>
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ attribute: AttributeDTO }>(`/admin/attributes/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: attributeQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: attributeQueryKeys.list(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

const ATTRIBUTE_POSSIBLE_VALUE_QUERY_KEY = "attribute-possible-value" as const;
export const attributePossibleValueQueryKeys = queryKeysFactory(
  ATTRIBUTE_POSSIBLE_VALUE_QUERY_KEY,
);

export const useUpdateAttributePossibleValue = (
  attributeId: string,
  possibleValueId: string,
  options?: UseMutationOptions<
    { possible_value: AttributePossibleValueDTO },
    FetchError,
    Partial<Pick<AttributePossibleValueDTO, "value" | "rank" | "metadata">>
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ possible_value: AttributePossibleValueDTO }>(
        `/admin/attributes/${attributeId}/values/${possibleValueId}`,
        {
          method: "POST",
          body: payload,
        },
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: attributeQueryKeys.detail(attributeId),
      });
      queryClient.invalidateQueries({
        queryKey: attributeQueryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: attributePossibleValueQueryKeys.detail(possibleValueId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductApplicableAttributes = (
  product_id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      { attributes: AttributeDTO[] },
      FetchError,
      { attributes: AttributeDTO[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: attributeQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch<{ attributes: AttributeDTO[] }>(
        `/admin/products/${product_id}/applicable-attributes`,
        {
          method: "GET",
          query,
        },
      ),
    ...options,
  });

  return { ...data, ...rest };
};
