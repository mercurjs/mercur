/**
 * Permission strings follow the pattern `{resource}:{operation}`, e.g.
 * `customer:read`, `product:create`, `order:*`.
 *
 * The resource list mirrors the policies registered server-side — Medusa's own
 * catalog plus Mercur's (`packages/core/src/policies`). A name that is not
 * registered there is not a type error, it simply never matches a granted
 * policy, so the two are kept in sync by a test in `packages/admin`.
 */

export type PermissionResource =
    | "api_key"
    | "campaign"
    | "commission_line"
    | "commission_rate"
    | "commission_rule"
    | "currency"
    | "customer"
    | "customer_address"
    | "customer_group"
    | "file"
    | "fulfillment"
    | "fulfillment_provider"
    | "fulfillment_set"
    | "inventory_item"
    | "inventory_level"
    | "invite"
    | "member_invite"
    | "notification"
    | "offer"
    | "order"
    | "order_change"
    | "order_claim"
    | "order_claim_item"
    | "order_exchange"
    | "order_group"
    | "order_item"
    | "payment"
    | "payment_collection"
    | "payment_method"
    | "payment_session"
    | "payout"
    | "payout_account"
    | "price"
    | "price_list"
    | "price_preference"
    | "product"
    | "product_attribute"
    | "product_attribute_value"
    | "product_category"
    | "product_change"
    | "product_collection"
    | "product_option"
    | "product_option_value"
    | "product_tag"
    | "product_type"
    | "product_variant"
    | "promotion"
    | "rbac_policy"
    | "rbac_role"
    | "refund_reason"
    | "region"
    | "reservation_item"
    | "return"
    | "return_reason"
    | "review"
    | "sales_channel"
    | "seller"
    | "seller_member"
    | "service_zone"
    | "shipping_option"
    | "shipping_option_type"
    | "shipping_profile"
    | "stock_location"
    | "store"
    | "store_locale"
    | "tax_provider"
    | "tax_rate"
    | "tax_region"
    | "translation"
    | "translation_setting"
    | "user"
    | "workflow_execution"

export type PermissionOperation = "read" | "create" | "update" | "delete" | "*"

export type Permission = `${PermissionResource}:${PermissionOperation}`

export interface UserPolicy {
    permissions: Permission[]
}

export interface PermissionRequirement {
    permissions: Permission[]
    /** If true, ALL permissions are required. Defaults to ANY. */
    requireAll?: boolean
    /** Optional label describing where the requirement came from. */
    source?: string
}

export interface PermissionsContextValue {
    policy: UserPolicy | null
    isLoading: boolean
    /** Whether RBAC is active. When `false`, every check resolves to `true`. */
    isRbacEnabled: boolean
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
    can: (
        resource: PermissionResource,
        operation: PermissionOperation
    ) => boolean
}

export interface PermissionsRequirementsContextValue {
    requiredPermissions: PermissionRequirement[]
    registerRequiredPermissions: (
        id: string,
        requirement: PermissionRequirement
    ) => void
    unregisterRequiredPermissions: (id: string) => void
}

/**
 * Operations implied by a granted operation. Only the wildcard fans out.
 * Note that `update` does not imply `read` — grants must be explicit.
 */
export const OPERATION_IMPLICATIONS: Record<
    PermissionOperation,
    PermissionOperation[]
> = {
    read: ["read"],
    create: ["create"],
    update: ["update"],
    delete: ["delete"],
    "*": ["read", "create", "update", "delete", "*"],
}

export function parsePermission(permission: string): {
    resource: PermissionResource
    operation: PermissionOperation
} | null {
    const parts = permission.split(":")
    if (parts.length !== 2) {
        return null
    }

    const [resource, operation] = parts

    return {
        resource: resource as PermissionResource,
        operation: operation as PermissionOperation,
    }
}

export function buildPermission(
    resource: PermissionResource,
    operation: PermissionOperation
): Permission {
    return `${resource}:${operation}` as Permission
}
