import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeysFactory } from "@mercurjs/dashboard-shared";
import { client } from "../../lib/client";
import { ClientError } from "@mercurjs/client";

const REQUESTS_QUERY_KEY = "vendor_requests" as const;
export const requestsQueryKeys = queryKeysFactory(REQUESTS_QUERY_KEY);

export type VendorRequestDTO = Record<string, any>;

type RequestType =
  | "product_category"
  | "product_collection"
  | "product_tag"
  | "product_type";

const clientMap = {
  product_category: client.vendor.requests.productCategories,
  product_collection: client.vendor.requests.productCollections,
  product_tag: client.vendor.requests.productTags,
  product_type: client.vendor.requests.productTypes,
} as Record<string, any>;

export const useVendorRequests = (
  type: RequestType,
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<unknown, ClientError, any>, "queryKey" | "queryFn">,
) => {
  const { data, ...rest } = useQuery({
    queryKey: requestsQueryKeys.list({ type, ...query }),
    queryFn: async () => clientMap[type].query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateVendorRequest = (
  type: RequestType,
  options?: UseMutationOptions<any, ClientError, Record<string, any>>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, any>) =>
      clientMap[type].mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: requestsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
