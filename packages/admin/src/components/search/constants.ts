import type { PermissionKey } from "@mercurjs/dashboard-sdk"

export const SEARCH_AREAS = [
  "all",
  "order",
  "product",
  "collection",
  "category",
  "inventory",
  "customer",
  "seller",
  "promotion",
  "campaign",
  "priceList",
  "productType",
  "productTag",
  "location",
  "command",
  "navigation",
] as const

export const SEARCH_AREA_PERMISSIONS: Partial<
  Record<(typeof SEARCH_AREAS)[number], PermissionKey>
> = {
  order: "orders",
  product: "products",
  collection: "product_collections",
  category: "product_categories",
  inventory: "inventory_items",
  customer: "customers",
  seller: "sellers",
  promotion: "promotions",
  campaign: "campaigns",
  priceList: "price_lists",
  productType: "product_types",
  productTag: "product_tags",
  location: "stock_locations",
}

export const DEFAULT_SEARCH_LIMIT = 3
export const SEARCH_LIMIT_INCREMENT = 20
