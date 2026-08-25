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
  "/orders": "order:read",
  "/products": "product:read",
  "/offers": "offer:read",
  "/collections": "product_collection:read",
  "/categories": "product_category:read",
  "/inventory": "inventory_item:read",
  "/reservations": "reservation_item:read",
  "/customers": "customer:read",
  "/customer-groups": "customer_group:read",
  "/promotions": "promotion:read",
  "/campaigns": "campaign:read",
  "/price-lists": "price_list:read",
  "/reviews": "review:read",
  "/payouts": "payout:read",

  "/settings/store": "seller:read",
  "/settings/users": "seller_member:read",
  "/settings/locations": "stock_location:read",
  "/settings/product-tags": "product_tag:read",
  "/settings/product-types": "product_type:read",
  "/settings/return-reasons": "return_reason:read",
  "/settings/shipping-profiles": "shipping_profile:read",
  "/settings/tax-regions": "tax_region:read",
  "/settings/fulfillment-providers": "fulfillment_provider:read",
}

export const getRoutePermission = (path: string): Permission | undefined =>
  ROUTE_PERMISSIONS[path]
