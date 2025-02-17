import { api } from "../../lib/client";
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { queryKeysFactory } from "../../lib/query-keys-factory";
import { VendorSeller } from "@mercurjs/http-client";

export const sellerQueryKeys = queryKeysFactory("seller");

export const useSellers = (
  query?: Parameters<typeof api.admin.adminListSellers>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminListSellers>[0],
      Error,
      { sellers: VendorSeller[] },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: sellerQueryKeys.list(query),
    queryFn: () => api.admin.adminListSellers(query).then((res) => res.data),
    ...options,
  });

  return { ...data, ...other };
};
