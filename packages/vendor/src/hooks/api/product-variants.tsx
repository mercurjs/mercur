import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { useInfiniteList } from "../use-infinite-list";

const PRODUCT_VARIANT_QUERY_KEY = "product_variant" as const;
export const productVariantQueryKeys = queryKeysFactory(
  PRODUCT_VARIANT_QUERY_KEY
);

export const useVariants = (
  query?: InferClientInput<typeof sdk.admin.productVariants.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.admin.productVariants.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productVariants.query({ ...query }),
    queryKey: productVariantQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useInfiniteVariants = (
  query?: Omit<
    InferClientInput<typeof sdk.admin.productVariants.query>,
    "offset" | "limit"
  > & {
    limit?: number;
  },
  options?: Omit<
    UseInfiniteQueryOptions<
      InferClientOutput<typeof sdk.admin.productVariants.query>,
      ClientError,
      InfiniteData<
        InferClientOutput<typeof sdk.admin.productVariants.query>,
        number
      >,
      InferClientOutput<typeof sdk.admin.productVariants.query>,
      QueryKey,
      number
    >,
    "queryFn" | "queryKey" | "initialPageParam" | "getNextPageParam"
  >
) => {
  return useInfiniteList({
    queryKey: (params) => productVariantQueryKeys.list(params),
    queryFn: (params) => sdk.admin.productVariants.query(params),
    query,
    options,
  });
};
