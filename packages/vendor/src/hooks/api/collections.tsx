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
import { productsQueryKeys } from "./products";
import { useInfiniteList } from "../use-infinite-list";

const COLLECTION_QUERY_KEY = "collections" as const;
export const collectionsQueryKeys = queryKeysFactory(COLLECTION_QUERY_KEY);

export const useCollection = (
  id: string,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.collections.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: collectionsQueryKeys.detail(id),
    queryFn: async () => sdk.admin.collections.$id.query({ id }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCollections = (
  query?: InferClientInput<typeof sdk.admin.collections.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.collections.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: collectionsQueryKeys.list(query),
    queryFn: async () => sdk.admin.collections.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteCollections = (
  query?: Omit<
    InferClientInput<typeof sdk.admin.collections.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.admin.collections.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.admin.collections.query>,
        number
      >,
      InferClientOutput<typeof sdk.admin.collections.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList({
    queryKey: (params) => collectionsQueryKeys.list(params),
    queryFn: (params) => sdk.admin.collections.query(params),
    query,
    options,
  });
};

export const useUpdateCollection = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.collections.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.collections.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.collections.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCollectionProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.collections.$id.products.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.collections.$id.products.mutate>,
      "id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.collections.$id.products.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.detail(id),
      });
      /**
       * Invalidate products list query to ensure that the products collections are updated.
       */
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateCollection = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.collections.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.collections.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.collections.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCollection = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.collections.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.collections.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
