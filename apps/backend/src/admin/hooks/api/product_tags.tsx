import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";
import { AdminProductTag } from "@mercurjs/http-client";

export const productTagsQueryKeys = queryKeysFactory("product_tags");

export const useProductTags = (
  query?: Parameters<typeof api.admin.adminGetProductTags>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminGetProductTags>[0],
      Error,
      { tags: AdminProductTag[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: () => api.admin.adminGetProductTags().then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};
