/**
 * Permission strings follow the pattern `{resource}:{operation}`, e.g.
 * `customer:read`, `product:create`, `order:*`.
 */

export type PermissionResource =
    | "customer"
    | "customer_group"
    | "order"
    | "product"
    | "product_category"
    | "product_collection"
    | "product_tag"
    | "product_type"
    | "inventory"
    | "reservation"
    | "promotion"
    | "campaign"
    | "price_list"
    | "region"
    | "store"
    | "user"
    | "rbac_role"
    | "rbac_policy"
    | "sales_channel"
    | "stock_location"
    | "shipping_profile"
    | "shipping_option"
    | "tax_region"
    | "api_key"
    | "return_reason"
    | "refund_reason"
    | "workflow"
    | "translation"

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
