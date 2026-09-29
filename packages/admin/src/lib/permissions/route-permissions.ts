import type { Permission } from "@mercurjs/dashboard-sdk"

/**
 * The permission that gates each navigable section, keyed by route path.
 *
 * The route map declares the same requirement on each domain's `handle` so
 * `RoutePermissionGuard` can enforce it; this map is what lets the sidebar hide
 * the link as well. A test keeps the two in agreement.
 *
 * Paths absent from this map are ungated (the dashboard root, a user's own
 * profile, and anything scoped to the acting user).
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/orders": "orders:view",
  "/products": "products:view",
  "/offers": "offers:view",
  "/collections": "taxonomy:view",
  "/categories": "taxonomy:view",
  "/inventory": "inventory:view",
  "/reservations": "inventory:view",
  "/customers": "customers:view",
  "/customer-groups": "customer_groups:view",
  "/promotions": "promotions:view",
  "/campaigns": "promotions:view",
  "/price-lists": "price_lists:view",
  "/stores": "sellers:view",
  "/reviews": "reviews:view",
  "/payouts": "payouts:view",

  "/settings/regions": "regions_tax:view",
  "/settings/marketplace": "store:view",
  "/settings/commissions": "commissions:view",
  "/settings/users": "users:view",
  "/settings/sales-channels": "sales_channels:view",
  "/settings/locations": "stock_locations:view",
  "/settings/product-tags": "taxonomy:view",
  "/settings/product-types": "taxonomy:view",
  "/settings/attributes": "attributes:view",
  "/settings/shipping-profiles": "shipping:view",
  "/settings/shipping-option-types": "shipping:view",
  "/settings/return-reasons": "return_reasons:view",
  "/settings/refund-reasons": "refund_reasons:view",
  "/settings/tax-regions": "regions_tax:view",
  "/settings/publishable-api-keys": "api_keys:view",
  "/settings/secret-api-keys": "api_keys:view",
}

export const getRoutePermission = (path: string): Permission | undefined =>
  ROUTE_PERMISSIONS[path]
