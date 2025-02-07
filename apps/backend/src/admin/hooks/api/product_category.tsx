import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";
import { ProductCategoryDTO } from "@medusajs/framework/types";

export const productCategoryQueryKeys = queryKeysFactory("product_category");

export const useProductCategory = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_category?: ProductCategoryDTO },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: productCategoryQueryKeys.detail(id),
    queryFn: () =>
      api.admin.adminGetProductCategoriesId(id).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};
