import type { Permission } from "@mercurjs/dashboard-sdk"

/**
 * The permission that gates each navigable section, keyed by route path.
 *
 * The route map declares the same requirement on each domain's `handle` so
 * `RoutePermissionGuard` can enforce it; this map is what lets the sidebar hide
 * the link as well. A test keeps the two in agreement.
 *
 * Paths absent from this map are ungated — the dashboard root, and anything
 * scoped to the acting member rather than to the store (their own profile).
 */
export const ROUTE_PERMISSIONS: Record<string, Permission | Permission[]> = {
  "/orders": "orders:view",
  "/products": "products:view",
  // An offer is always shown with its master product.
  "/offers": ["offers:view", "products:view"],
  "/collections": "product_collections:view",
  "/categories": "product_categories:view",
  "/inventory": "inventory_items:view",
  "/reservations": "reservations:view",
  "/customers": "customers:view",
  "/customer-groups": "customer_groups:view",
  "/promotions": "promotions:view",
  "/campaigns": "campaigns:view",
  "/price-lists": "price_lists:view",
  "/reviews": "reviews:view",
  "/payouts": "payouts:view",

  "/settings/store": "store:view",
  "/settings/users": "members:view",
  "/settings/locations": "stock_locations:view",
  "/settings/product-tags": "product_tags:view",
  "/settings/product-types": "product_types:view",
  "/settings/return-reasons": "return_reasons:view",
  "/settings/locations/shipping-profiles": "shipping_profiles:view",
}

export const getRoutePermission = (
  path: string
): Permission | Permission[] | undefined => ROUTE_PERMISSIONS[path]
