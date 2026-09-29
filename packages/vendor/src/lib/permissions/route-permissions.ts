import type { Permission } from "@mercurjs/dashboard-sdk"

/**
 * The permission that gates each navigable section, keyed by route path.
 *
 * The route map declares the same requirement on each domain's `handle` so
 * `RoutePermissionGuard` can enforce it; this map is what lets the sidebar hide
 * the link as well.
 *
 * Paths absent from this map are ungated — the dashboard root, and anything
 * scoped to the acting member rather than to the store (their own profile).
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
  "/reviews": "reviews:view",
  "/payouts": "payouts:view",

  "/settings/store": "store:view",
  "/settings/users": "members:view",
  "/settings/locations": "stock_locations:view",
  "/settings/product-tags": "taxonomy:view",
  "/settings/product-types": "taxonomy:view",
  "/settings/return-reasons": "return_reasons:view",
  "/settings/shipping-profiles": "shipping:view",
  "/settings/tax-regions": "regions_tax:view",
  "/settings/fulfillment-providers": "shipping:view",
}

export const getRoutePermission = (path: string): Permission | undefined =>
  ROUTE_PERMISSIONS[path]
