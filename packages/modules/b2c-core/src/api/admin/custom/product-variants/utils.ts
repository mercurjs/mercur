import type { ProductVariantDTO } from "@medusajs/framework/types";
import { HttpTypes } from "@medusajs/framework/types";
import { remapVariantResponse } from "@medusajs/medusa/api/admin/products/helpers";
import type { StockLocationManagedBy } from "../../../../utils/stock-locations";

export type VariantCustomFilters = {
  seller_id?: string;
  has_price?: boolean;
  has_inventory?: boolean;
  has_stock_location?: boolean;
  has_admin_stock_location?: boolean;
  q?: string;
};

export type AdminVariantWithManagedBy = HttpTypes.AdminProductVariant & {
  managed_by: StockLocationManagedBy;
};

export function splitVariantFilters(
  input: unknown
): { custom: VariantCustomFilters; filters: Record<string, unknown> } {
  const record: Record<string, unknown> =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const {
    seller_id: seller_id_raw,
    has_price: has_price_raw,
    has_inventory: has_inventory_raw,
    has_stock_location: has_stock_location_raw,
    has_admin_stock_location: has_admin_stock_location_raw,
    q: q_raw,
    ...filters
  } = record;

  const custom: VariantCustomFilters = {
    seller_id: typeof seller_id_raw === "string" ? seller_id_raw : undefined,
    has_price: typeof has_price_raw === "boolean" ? has_price_raw : undefined,
    has_inventory:
      typeof has_inventory_raw === "boolean" ? has_inventory_raw : undefined,
    has_stock_location:
      typeof has_stock_location_raw === "boolean"
        ? has_stock_location_raw
        : undefined,
    has_admin_stock_location:
      typeof has_admin_stock_location_raw === "boolean"
        ? has_admin_stock_location_raw
        : undefined,
    q: typeof q_raw === "string" ? q_raw : undefined,
  };

  return { custom, filters };
}

export function remapVariantWithManagedBy(
  variant: ProductVariantDTO
): AdminVariantWithManagedBy {
  const remapped = remapVariantResponse(variant);
  const managedBy =
    typeof (variant as unknown as { managed_by?: unknown }).managed_by === "string"
      ? ((variant as unknown as { managed_by?: StockLocationManagedBy })
          .managed_by as StockLocationManagedBy)
      : "none";

  return { ...remapped, managed_by: managedBy };
}


