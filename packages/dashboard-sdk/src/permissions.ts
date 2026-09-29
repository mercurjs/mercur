/**
 * Permission strings follow `{key}:{right}`, e.g. `orders:view`,
 * `products:edit`, `sellers.approval:edit`.
 *
 * Keys mirror the catalog declared server-side with `defineMercurPermissions`
 * (`packages/core/src/permissions/definitions`). Rights nest:
 * `manage` implies `edit`, `edit` implies `view`.
 */

export type PermissionKey =
    | "sellers"
    | "sellers.approval"
    | "sellers.premium"
    | "members"
    | "members.invites"
    | "roles"
    | "roles.owner"
    | "orders"
    | "orders.refunds"
    | "orders.returns"
    | "orders.edits"
    | "order_groups"
    | "payments"
    | "customers"
    | "customer_groups"
    | "products"
    | "products.review"
    | "product_changes"
    | "product_categories"
    | "product_collections"
    | "product_types"
    | "product_tags"
    | "product_attributes"
    | "offers"
    | "inventory_items"
    | "reservations"
    | "stock_locations"
    | "price_lists"
    | "price_preferences"
    | "promotions"
    | "campaigns"
    | "commission_rates"
    | "commission_lines"
    | "payouts"
    | "payout_accounts"
    | "shipping_profiles"
    | "shipping_options"
    | "fulfillment_sets"
    | "regions"
    | "tax_regions"
    | "store"
    | "sales_channels"
    | "return_reasons"
    | "refund_reasons"
    | "users"
    | "api_keys"
    | "translations"
    | "notifications"
    | "workflow_executions"
    | "reviews"

export type PermissionRight = "view" | "edit" | "manage"

export type Permission = `${PermissionKey}:${PermissionRight}`

/** Effective rights of the acting user, as returned by `fields=+permissions`. */
export type PermissionMap = Partial<Record<string, PermissionRight>>

export const PERMISSION_RIGHT_RANK: Record<PermissionRight, number> = {
    view: 1,
    edit: 2,
    manage: 3,
}

export interface PermissionsContextValue {
    /** `null` while no access-control module is enforcing permissions. */
    permissions: PermissionMap | null
    isLoading: boolean
    /** When `false`, every check resolves to `true`. */
    isEnforced: boolean
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
    can: (key: PermissionKey, right?: PermissionRight) => boolean
}

export function parsePermission(
    permission: string
): { key: PermissionKey; right: PermissionRight } | null {
    const index = permission.lastIndexOf(":")
    if (index <= 0) {
        return null
    }

    const right = permission.slice(index + 1)
    if (!(right in PERMISSION_RIGHT_RANK)) {
        return null
    }

    return {
        key: permission.slice(0, index) as PermissionKey,
        right: right as PermissionRight,
    }
}

export function buildPermission(
    key: PermissionKey,
    right: PermissionRight
): Permission {
    return `${key}:${right}`
}

export function satisfiesPermission(
    permissions: PermissionMap,
    key: string,
    right: PermissionRight
): boolean {
    const granted = permissions[key]
    return (
        !!granted &&
        PERMISSION_RIGHT_RANK[granted] >= PERMISSION_RIGHT_RANK[right]
    )
}
