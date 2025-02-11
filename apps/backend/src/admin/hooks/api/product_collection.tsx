import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";
import { AdminCollection } from "@mercurjs/http-client";

export const productCollectionQueryKeys =
  queryKeysFactory("product_collection");

export const useProductCollection = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_collection?: AdminCollection },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: productCollectionQueryKeys.detail(id),
    queryFn: () => api.admin.adminGetCollectionsId(id).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};
