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
    | "access.roles"
    | "access.owner"
    | "orders"
    | "orders.refunds"
    | "orders.returns"
    | "orders.edits"
    | "order_groups"
    | "customers"
    | "customer_groups"
    | "products"
    | "products.review"
    | "product_changes"
    | "offers"
    | "attributes"
    | "taxonomy"
    | "inventory"
    | "stock_locations"
    | "price_lists"
    | "price_preferences"
    | "promotions"
    | "commissions"
    | "payouts"
    | "payout_accounts"
    | "payments"
    | "shipping"
    | "store"
    | "regions_tax"
    | "sales_channels"
    | "return_reasons"
    | "refund_reasons"
    | "users"
    | "api_keys"
    | "platform"
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
