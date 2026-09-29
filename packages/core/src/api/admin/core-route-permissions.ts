import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import { PermissionRight } from "@mercurjs/types"

import { requirePermission } from "../utils/permissions-middleware"

type CoreRoutePermission = {
  pattern: RegExp
  key: string
  methods?: Partial<Record<string, PermissionRight>>
}

const byMethod = (method: string): PermissionRight =>
  method === "GET" || method === "HEAD"
    ? "view"
    : method === "DELETE"
      ? "manage"
      : "edit"

// First match wins, so specific rules come before their domain's catch-all.
export const CORE_ROUTE_PERMISSIONS: CoreRoutePermission[] = [
  { pattern: /^\/admin\/sellers\/[^/]+\/(approve|suspend|unsuspend|terminate|unterminate)$/, key: "sellers.approval" },
  { pattern: /^\/admin\/products\/[^/]+\/(confirm|reject|request-changes)$/, key: "products.review" },
  { pattern: /^\/admin\/product-changes\/[^/]+\/(confirm|decline|cancel)$/, key: "products.review" },

  { pattern: /^\/admin\/orders\/[^/]+\/(refund|credit-lines)/, key: "orders.refunds" },
  { pattern: /^\/admin\/payments\/[^/]+\/refund/, key: "orders.refunds" },
  { pattern: /^\/admin\/(returns|claims|exchanges)(\/|$)/, key: "orders.returns" },
  { pattern: /^\/admin\/(order-edits|order-changes)(\/|$)/, key: "orders.edits" },
  { pattern: /^\/admin\/(orders|draft-orders)(\/|$)/, key: "orders" },
  { pattern: /^\/admin\/(payments|payment-collections)(\/|$)/, key: "payments" },

  { pattern: /^\/admin\/customer-groups(\/|$)/, key: "customer_groups" },
  { pattern: /^\/admin\/customers(\/|$)/, key: "customers" },

  { pattern: /^\/admin\/(product-categories|collections|product-types|product-tags)(\/|$)/, key: "taxonomy" },
  { pattern: /^\/admin\/(products|product-variants|product-options)(\/|$)/, key: "products" },
  { pattern: /^\/admin\/(inventory-items|reservations)(\/|$)/, key: "inventory" },
  { pattern: /^\/admin\/stock-locations(\/|$)/, key: "stock_locations" },
  { pattern: /^\/admin\/price-preferences(\/|$)/, key: "price_preferences" },
  { pattern: /^\/admin\/price-lists(\/|$)/, key: "price_lists" },
  { pattern: /^\/admin\/(promotions|campaigns)(\/|$)/, key: "promotions" },
  { pattern: /^\/admin\/(shipping-options|shipping-option-types|shipping-profiles|fulfillment-sets|fulfillment-providers|fulfillments)(\/|$)/, key: "shipping" },

  { pattern: /^\/admin\/(regions|tax-regions|tax-rates|tax-providers|currencies)(\/|$)/, key: "regions_tax" },
  { pattern: /^\/admin\/sales-channels(\/|$)/, key: "sales_channels" },
  { pattern: /^\/admin\/return-reasons(\/|$)/, key: "return_reasons" },
  { pattern: /^\/admin\/refund-reasons(\/|$)/, key: "refund_reasons" },
  { pattern: /^\/admin\/stores(\/|$)/, key: "store" },
  { pattern: /^\/admin\/invites(\/|$)/, key: "users" },
  { pattern: /^\/admin\/users\/me$/, key: "users", methods: { GET: undefined } },
  { pattern: /^\/admin\/users(\/|$)/, key: "users" },
  { pattern: /^\/admin\/api-keys(\/|$)/, key: "api_keys" },
  { pattern: /^\/admin\/(translations|locales|notifications|workflows-executions|search|search-indexes|index|views|property-labels|plugins|layouts)(\/|$)/, key: "platform" },
]

export function matchCoreRoutePermission(
  path: string,
  method: string
): { key: string; right: PermissionRight } | null | undefined {
  const rule = CORE_ROUTE_PERMISSIONS.find((candidate) =>
    candidate.pattern.test(path)
  )

  if (!rule) {
    return undefined
  }

  const upper = method.toUpperCase()
  if (rule.methods && upper in rule.methods) {
    const right = rule.methods[upper]
    return right ? { key: rule.key, right } : null
  }

  return { key: rule.key, right: byMethod(upper) }
}

/**
 * Guards the core Medusa admin routes Mercur exposes. The map is Mercur's own
 * and deliberately independent of Medusa's route `policies` declarations.
 */
export function enforceCoreRoutePermissions(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const path = (req.originalUrl ?? req.url).split("?")[0]
  const match = matchCoreRoutePermission(path, req.method)

  if (!match) {
    return next()
  }

  return requirePermission(match.key, match.right)(req, res, next)
}
