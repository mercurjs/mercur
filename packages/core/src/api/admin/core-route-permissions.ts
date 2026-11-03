import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import {
  MISSING_PERMISSION_CODE,
  PermissionRequirement,
  PermissionRight,
} from "@mercurjs/types"

import {
  requireAnyPermission,
  requirePermission,
} from "../utils/permissions-middleware"

type CoreRoutePermission = {
  pattern: RegExp
  key: string
  // Routes shared by several domains accept any one of these instead of `key`.
  anyOf?: string[]
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

  { pattern: /^\/admin\/product-categories(\/|$)/, key: "product_categories" },
  { pattern: /^\/admin\/collections(\/|$)/, key: "product_collections" },
  { pattern: /^\/admin\/product-types(\/|$)/, key: "product_types" },
  { pattern: /^\/admin\/product-tags(\/|$)/, key: "product_tags" },
  { pattern: /^\/admin\/(products|product-variants|product-options)(\/|$)/, key: "products" },
  { pattern: /^\/admin\/inventory-items(\/|$)/, key: "inventory_items" },
  { pattern: /^\/admin\/reservations(\/|$)/, key: "reservations" },
  { pattern: /^\/admin\/stock-locations(\/|$)/, key: "stock_locations" },
  { pattern: /^\/admin\/price-preferences(\/|$)/, key: "price_preferences" },
  { pattern: /^\/admin\/price-lists(\/|$)/, key: "price_lists" },
  { pattern: /^\/admin\/promotions(\/|$)/, key: "promotions" },
  { pattern: /^\/admin\/campaigns(\/|$)/, key: "campaigns" },
  { pattern: /^\/admin\/shipping-profiles(\/|$)/, key: "shipping_profiles" },
  { pattern: /^\/admin\/(shipping-options|shipping-option-types)(\/|$)/, key: "shipping_options" },
  { pattern: /^\/admin\/(fulfillment-sets|fulfillment-providers|fulfillments)(\/|$)/, key: "fulfillment_sets" },

  { pattern: /^\/admin\/(regions|currencies)(\/|$)/, key: "regions" },
  { pattern: /^\/admin\/(tax-regions|tax-rates|tax-providers)(\/|$)/, key: "tax_regions" },
  { pattern: /^\/admin\/sales-channels(\/|$)/, key: "sales_channels" },
  { pattern: /^\/admin\/return-reasons(\/|$)/, key: "return_reasons" },
  { pattern: /^\/admin\/refund-reasons(\/|$)/, key: "refund_reasons" },
  // The shell and most forms read the store (currencies, default region and sales channel).
  { pattern: /^\/admin\/stores(\/[^/]+)?$/, key: "store", methods: { GET: undefined } },
  { pattern: /^\/admin\/stores(\/|$)/, key: "store" },
  { pattern: /^\/admin\/invites(\/|$)/, key: "users" },
  // Reading and editing your own profile needs no users permission.
  { pattern: /^\/admin\/users\/me$/, key: "users", methods: { GET: undefined, POST: undefined } },
  { pattern: /^\/admin\/users(\/|$)/, key: "users" },
  { pattern: /^\/admin\/rbac(\/|$)/, key: "users" },
  { pattern: /^\/admin\/api-keys(\/|$)/, key: "api_keys" },
  { pattern: /^\/admin\/(translations|locales)(\/|$)/, key: "translations" },
  { pattern: /^\/admin\/notifications(\/|$)/, key: "notifications" },
  { pattern: /^\/admin\/workflows-executions(\/|$)/, key: "workflow_executions" },
  { pattern: /^\/admin\/(search|search-indexes|index|views|property-labels|plugins|layouts)(\/|$)/, key: "store" },
  { pattern: /^\/admin\/feature-flags$/, key: "store", methods: { GET: undefined } },
  { pattern: /^\/admin\/uploads(\/|$)/, key: "products", anyOf: ["products", "sellers", "store"] },
]

/**
 * Express matches routes case-insensitively and tolerates duplicate and
 * trailing slashes, so the path is reduced to the form the table is written
 * in before matching. A path that cannot be decoded is left as-is and ends
 * up as an unknown route.
 */
export function normalizeAdminPath(url: string): string {
  let path = url.split("?")[0].split("#")[0]

  try {
    path = decodeURIComponent(path)
  } catch {
    return path
  }

  path = path.toLowerCase().replace(/\/{2,}/g, "/")

  return path.length > 1 ? path.replace(/\/+$/, "") : path
}

type CoreRoutePermissionMatch = {
  key: string
  right: PermissionRight
  anyOf?: string[]
}

export function matchCoreRoutePermission(
  path: string,
  method: string
): CoreRoutePermissionMatch | null | undefined {
  const normalized = normalizeAdminPath(path)
  const rule = CORE_ROUTE_PERMISSIONS.find((candidate) =>
    candidate.pattern.test(normalized)
  )

  if (!rule) {
    return undefined
  }

  const upper = method.toUpperCase()
  const right =
    rule.methods && upper in rule.methods
      ? rule.methods[upper]
      : byMethod(upper)

  if (!right) {
    return null
  }

  return rule.anyOf
    ? { key: rule.key, right, anyOf: rule.anyOf }
    : { key: rule.key, right }
}

const isAdminPath = (path: string) =>
  path === "/admin" || path.startsWith("/admin/")

const hasAnyPermission = (req: AuthenticatedMedusaRequest) =>
  Object.values(req.permissions ?? {}).some((right) => !!right)

/**
 * Guards the core Medusa admin routes Mercur exposes. The map is Mercur's own
 * and deliberately independent of Medusa's route `policies` declarations.
 *
 * Mercur-owned routes carry their own `requirePermission` middleware and are
 * not in the table. Any other admin path the table does not know is only let
 * through to an actor that holds at least one permission, so a role with an
 * empty grant cannot reach handlers the table missed.
 */
export function enforceCoreRoutePermissions(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const path = normalizeAdminPath(req.originalUrl ?? req.url)
  const match = matchCoreRoutePermission(path, req.method)

  if (match === null) {
    return next()
  }

  if (match === undefined) {
    if (
      isAdminPath(path) &&
      req.permissions_enforced &&
      !hasAnyPermission(req)
    ) {
      return res.status(403).json({
        type: "not_allowed",
        code: MISSING_PERMISSION_CODE,
        message: `No permission grants access to ${req.method} ${path}`,
      })
    }

    return next()
  }

  if (match.anyOf) {
    const requirements: PermissionRequirement[] = match.anyOf.map((key) => ({
      key,
      right: match.right,
    }))
    return requireAnyPermission(requirements)(req, res, next)
  }

  return requirePermission(match.key, match.right)(req, res, next)
}
