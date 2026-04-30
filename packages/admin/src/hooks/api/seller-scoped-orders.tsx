import { ClientError, InferClientInput } from "@mercurjs/client";
import { HttpTypes } from "@medusajs/types";
import {
  QueryKey,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const SELLER_SCOPED_ORDERS_QUERY_KEY = "seller-scoped-orders" as const;

export const sellerScopedOrdersQueryKeys = queryKeysFactory(
  SELLER_SCOPED_ORDERS_QUERY_KEY,
);

type SellerValidStockLocationsResponse = {
  stock_locations: HttpTypes.AdminStockLocation[];
  count: number;
  limit: number;
  offset: number;
};

/**
 * Returns stock locations linked to the order's seller (via the
 * stock_location_seller link). Replaces the global stock-locations
 * picker in admin Return / Claim / Exchange drawers per spec 006.
 *
 * Backend: GET /admin/orders/:id/seller-valid-stock-locations.
 */
export const useSellerValidStockLocations = (
  orderId: string,
  query?: InferClientInput<
    typeof sdk.admin.orders.$id.sellerValidStockLocations.query
  >,
  options?: Omit<
    UseQueryOptions<
      SellerValidStockLocationsResponse,
      ClientError,
      SellerValidStockLocationsResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.sellerValidStockLocations.query({
        $id: orderId,
        ...query,
      }) as Promise<SellerValidStockLocationsResponse>,
    queryKey: sellerScopedOrdersQueryKeys.detail(orderId, {
      kind: "stock-locations",
      ...query,
    }),
    ...options,
  });

  return { ...data, ...rest };
};
