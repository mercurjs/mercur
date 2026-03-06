import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeysFactory } from "@mercurjs/dashboard-shared";
import { client } from "../../lib/client";
import { ClientError } from "@mercurjs/client";

const REQUESTS_QUERY_KEY = "vendor_requests" as const;
export const requestsQueryKeys = queryKeysFactory(REQUESTS_QUERY_KEY);

export type VendorRequestDTO = Record<string, any>;

export const useVendorRequests = (
  type: "product_category" | "product_collection" | "product_tag" | "product_type",
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<unknown, ClientError, any>, "queryKey" | "queryFn">,
) => {
  const clientMap = {
    product_category: client.vendor.productCategories,
    product_collection: client.vendor.productCollections,
    product_tag: client.vendor.productTags,
    product_type: client.vendor.productTypes,
  } as Record<string, any>;

  const { data, ...rest } = useQuery({
    queryKey: requestsQueryKeys.list({ type, ...query }),
    queryFn: async () => clientMap[type].query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};
