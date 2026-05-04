import { ClientError } from "@mercurjs/client";
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

type SellerValidStockLocationsQuery = {
  limit?: number;
  offset?: number;
};

/**
 * Returns stock locations linked to the order's seller (via the
 * stock_location_seller link). Used by the admin Return / Claim /
 * Exchange drawers in place of the global stock-locations picker.
 */
export const useSellerValidStockLocations = (
  orderId: string,
  query?: SellerValidStockLocationsQuery,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStockLocationListResponse,
      ClientError,
      HttpTypes.AdminStockLocationListResponse,
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
      }) as Promise<HttpTypes.AdminStockLocationListResponse>,
    queryKey: sellerScopedOrdersQueryKeys.detail(orderId, {
      kind: "stock-locations",
      ...query,
    }),
    ...options,
  });

  return { ...data, ...rest };
};

type SellerValidShippingOptionsQuery = {
  location_id?: string;
  is_return?: boolean | string;
  limit?: number;
  offset?: number;
};

/**
 * Returns shipping options linked to the order's seller and filtered by
 * location + direction (return vs outbound). Used by the admin Return /
 * Claim / Exchange drawers in place of the global shipping-option picker.
 *
 * Query params:
 *   - location_id: filter to options bound to a fulfillment set reachable
 *     from this stock location. Pass it whenever the upstream location
 *     picker can change so the result set refetches.
 *   - is_return: "true" → return shipping options; "false"/omitted →
 *     outbound shipping options.
 */
export const useSellerValidShippingOptions = (
  orderId: string,
  query?: SellerValidShippingOptionsQuery,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminShippingOptionListResponse,
      ClientError,
      HttpTypes.AdminShippingOptionListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.sellerValidShippingOptions.query({
        $id: orderId,
        ...query,
      }) as Promise<HttpTypes.AdminShippingOptionListResponse>,
    queryKey: sellerScopedOrdersQueryKeys.detail(orderId, {
      kind: "shipping-options",
      ...query,
    }),
    ...options,
  });

  return { ...data, ...rest };
};

export type AddableVariantEligibility =
  | { can_add: true; reason: "ok" }
  | { can_add: false; reason: "no_price" | "no_inventory" };

export type AddableVariant = HttpTypes.AdminProductVariant & {
  eligibility: AddableVariantEligibility;
};

type AddableVariantsQuery = {
  search?: string;
  limit?: number;
  offset?: number;
};

type AddableVariantsResponse = Omit<
  HttpTypes.AdminProductVariantListResponse,
  "variants"
> & {
  variants: AddableVariant[];
};

/**
 * Returns variants of products owned by the order's seller, with per-row
 * eligibility for adding to an order edit / claim outbound / exchange
 * outbound. Used in place of the global variant catalog in those drawers.
 *
 * Callers are expected to debounce search input upstream (the
 * `_DataTable` component already does this for its built-in search).
 */
export const useAddableVariants = (
  orderId: string,
  query?: AddableVariantsQuery,
  options?: Omit<
    UseQueryOptions<
      AddableVariantsResponse,
      ClientError,
      AddableVariantsResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      sdk.admin.orders.$id.addableVariants.query({
        $id: orderId,
        ...query,
      }) as Promise<AddableVariantsResponse>,
    queryKey: sellerScopedOrdersQueryKeys.detail(orderId, {
      kind: "addable-variants",
      ...query,
    }),
    ...options,
  });

  return { ...data, ...rest };
};

