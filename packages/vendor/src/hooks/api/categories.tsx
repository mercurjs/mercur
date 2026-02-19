import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { productsQueryKeys } from "./products";
import { useInfiniteList } from "../use-infinite-list";
import { AdminProductCategoryResponse, HttpTypes } from "@mercurjs/types";

const CATEGORIES_QUERY_KEY = "categories" as const;
export const categoriesQueryKeys = queryKeysFactory(CATEGORIES_QUERY_KEY);

export const useProductCategory = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.productCategories.$id.query>,
    "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.productCategories.$id.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: categoriesQueryKeys.detail(id, query),
    queryFn: () =>
      sdk.vendor.productCategories.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductCategories = (
  query?: InferClientInput<typeof sdk.vendor.productCategories.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.productCategories.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: categoriesQueryKeys.list(query),
    queryFn: () => sdk.vendor.productCategories.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteCategories = (
  query?: Omit<
    InferClientInput<typeof sdk.vendor.productCategories.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.vendor.productCategories.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.vendor.productCategories.query>,
        number
      >,
      InferClientOutput<typeof sdk.vendor.productCategories.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >,
) => {
  return useInfiniteList({
    queryKey: (params) => categoriesQueryKeys.list(params),
    queryFn: (params) => sdk.vendor.productCategories.query(params),
    query,
    options,
  });
};

export const useCreateProductCategory = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productCategories.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.productCategories.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.productCategories.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductCategory = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productCategories.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.productCategories.$id.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.productCategories.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductCategory = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productCategories.$id.delete>,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.productCategories.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

type UseUpdateProductCategoryProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productCategories.$id.products.mutate>,
    ClientError,
    Omit<AdminProductCategoryResponse, "$id">
  >,
) => UseMutationResult<
  InferClientOutput<typeof sdk.vendor.productCategories.$id.products.mutate>,
  ClientError,
  Omit<AdminProductCategoryResponse, "$id">
>;

export const useUpdateProductCategoryProducts: UseUpdateProductCategoryProducts =
  (id, options) => {
    return useMutation({
      mutationFn: (payload) =>
        sdk.vendor.productCategories.$id.products.mutate({
          $id: id,
          ...payload,
        }),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries({
          queryKey: categoriesQueryKeys.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: categoriesQueryKeys.details(),
        });
        /**
         * Invalidate products list query to ensure that the products collections are updated.
         */
        queryClient.invalidateQueries({
          queryKey: productsQueryKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey: productsQueryKeys.details(),
        });

        options?.onSuccess?.(data, variables, context);
      },
      ...options,
    });
  };
