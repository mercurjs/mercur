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

const PRODUCT_TYPES_QUERY_KEY = "product_types" as const;
export const productTypesQueryKeys = queryKeysFactory(PRODUCT_TYPES_QUERY_KEY);

export const useProductType = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.productTypes.$id.query>,
    "id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.productTypes.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productTypes.$id.query({ id, ...query }),
    queryKey: productTypesQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductTypes = (
  query?: InferClientInput<typeof sdk.admin.productTypes.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.productTypes.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productTypes.query({ ...query }),
    queryKey: productTypesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteProductTypes = (
  query?: Omit<
    InferClientInput<typeof sdk.admin.productTypes.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.admin.productTypes.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.admin.productTypes.query>,
        number
      >,
      InferClientOutput<typeof sdk.admin.productTypes.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList({
    queryKey: (params) => productTypesQueryKeys.list(params),
    queryFn: (params) => sdk.admin.productTypes.query(params),
    query,
    options,
  });
};

export const useCreateProductType = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTypes.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.productTypes.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.productTypes.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTypes.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.admin.productTypes.$id.mutate>, "id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productTypes.$id.mutate({ id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductType = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.productTypes.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productTypes.$id.delete({ id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
