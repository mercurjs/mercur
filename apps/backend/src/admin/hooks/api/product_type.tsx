import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { api } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-keys-factory";
import { ProductTypeDTO } from "@medusajs/framework/types";

export const productTypeQueryKeys = queryKeysFactory("product_type");

export const useProductType = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      { product_type?: ProductTypeDTO },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: productTypeQueryKeys.detail(id),
    queryFn: () => api.admin.adminGetProductTypesId(id).then((res) => res.data),

    ...options,
  });

  return { ...data, ...other };
};
