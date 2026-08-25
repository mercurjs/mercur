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
  "/stores": "seller:read",
  "/reviews": "review:read",
  "/payouts": "payout:read",

  "/settings/regions": "region:read",
  "/settings/marketplace": "store:read",
  "/settings/commissions": "commission_rate:read",
  "/settings/users": "user:read",
  "/settings/sales-channels": "sales_channel:read",
  "/settings/locations": "stock_location:read",
  "/settings/product-tags": "product_tag:read",
  "/settings/product-types": "product_type:read",
  "/settings/attributes": "product_attribute:read",
  "/settings/shipping-profiles": "shipping_profile:read",
  "/settings/shipping-option-types": "shipping_option_type:read",
  "/settings/return-reasons": "return_reason:read",
  "/settings/refund-reasons": "refund_reason:read",
  "/settings/tax-regions": "tax_region:read",
  "/settings/publishable-api-keys": "api_key:read",
  "/settings/secret-api-keys": "api_key:read",
}

export const getRoutePermission = (path: string): Permission | undefined =>
  ROUTE_PERMISSIONS[path]
