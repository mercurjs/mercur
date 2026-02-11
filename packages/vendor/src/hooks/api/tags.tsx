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
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { useInfiniteList } from "../use-infinite-list";

const TAGS_QUERY_KEY = "tags" as const;
export const productTagsQueryKeys = queryKeysFactory(TAGS_QUERY_KEY);

export const useProductTag = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.productTags.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.productTags.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productTagsQueryKeys.detail(id, query),
    queryFn: async () => sdk.vendor.productTags.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductTags = (
  query?: InferClientInput<typeof sdk.vendor.productTags.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.productTags.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: async () => sdk.vendor.productTags.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteProductTags = (
  query?: Omit<
    InferClientInput<typeof sdk.vendor.productTags.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.vendor.productTags.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.vendor.productTags.query>,
        number
      >,
      InferClientOutput<typeof sdk.vendor.productTags.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList({
    queryKey: (params) => productTagsQueryKeys.list(params),
    queryFn: (params) => sdk.vendor.productTags.query(params),
    query,
    options,
  });
};

export const useCreateProductTag = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productTags.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.productTags.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.productTags.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductTag = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productTags.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.productTags.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.productTags.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(data.product_tag.id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductTag = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.productTags.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.productTags.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
