import { ProductCategoryDTO, ProductTypeDTO } from "@medusajs/framework/types";
import { api } from "../../lib/client";
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { queryKeysFactory } from "../../lib/query-keys-factory";

export const productQueryKeys = queryKeysFactory("product");

export const useProductCategories = (
  query?: Parameters<typeof api.admin.adminGetProductCategories>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminGetProductCategories>[0],
      Error,
      { product_categories: ProductCategoryDTO[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: productQueryKeys.list(query),
    queryFn: () =>
      api.admin.adminGetProductCategories(query).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};

export const useProductTypes = (
  query?: Parameters<typeof api.admin.adminGetProductTypes>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminGetProductTypes>[0],
      Error,
      { product_types: ProductTypeDTO[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: productQueryKeys.list(query),
    queryFn: () =>
      api.admin.adminGetProductTypes(query).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};
