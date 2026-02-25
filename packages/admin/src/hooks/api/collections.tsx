import { ClientError, InferClientInput } from "@mercurjs/client";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { productsQueryKeys } from "./products";
import {
  AdminCollectionResponse,
  AdminDeletePaymentCollectionResponse,
} from "@mercurjs/types";

const COLLECTION_QUERY_KEY = "collections" as const;
export const collectionsQueryKeys = queryKeysFactory(COLLECTION_QUERY_KEY);

export const useCollection = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.collections.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<
      AdminCollectionResponse,
      ClientError,
      AdminCollectionResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: collectionsQueryKeys.detail(id),
    queryFn: () => sdk.admin.collections.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCollections = (
  query?: InferClientInput<typeof sdk.admin.collections.query>,
  options?: Omit<
    UseQueryOptions<
      AdminCollectionResponse,
      ClientError,
      AdminCollectionResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: collectionsQueryKeys.list(query),
    queryFn: () => sdk.admin.collections.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateCollection = (
  id: string,
  options?: UseMutationOptions<
    AdminCollectionResponse,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.collections.$id.mutate>, "$id">
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.collections.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() });
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
    AdminCollectionResponse,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.collections.$id.products.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.collections.$id.products.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() });
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
    AdminCollectionResponse,
    ClientError,
    InferClientInput<typeof sdk.admin.collections.mutate>
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.collections.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCollection = (
  id: string,
  options?: UseMutationOptions<
    AdminDeletePaymentCollectionResponse,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () => sdk.admin.collections.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
