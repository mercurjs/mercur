import { IRbacModuleService, RbacRoleDTO } from "@medusajs/types"
import { SellerRole } from "@mercurjs/types"

type SellerRoleDefinition = {
  id: SellerRole
  name: string
  description: string
  policyKeys: "*" | string[]
}

const CRUD_OPERATIONS = ["read", "create", "update", "delete"] as const

const crud = (resource: string): string[] =>
  CRUD_OPERATIONS.map((operation) => `${resource}:${operation}`)

const readOnly = (...resources: string[]): string[] =>
  resources.map((resource) => `${resource}:read`)

export const SELLER_ROLES: SellerRoleDefinition[] = [
  {
    id: SellerRole.SELLER_ADMINISTRATION,
    name: "Seller Administration",
    description:
      "Full access to all seller account features and settings",
    policyKeys: "*",
  },
  {
    id: SellerRole.INVENTORY_MANAGEMENT,
    name: "Inventory Management",
    description: "Manage offers and catalog",
    policyKeys: [
      ...crud("product"),
      ...crud("product_variant"),
      ...crud("product_option"),
      ...crud("product_tag"),
      ...crud("product_type"),
      ...crud("product_category"),
      ...crud("product_collection"),
      ...crud("product_attribute"),
      ...crud("product_attribute_value"),
      ...crud("product_change"),
      ...crud("offer"),
      ...crud("inventory_item"),
      ...crud("reservation_item"),
      ...crud("stock_location"),
      ...crud("price_list"),
      ...crud("price_preference"),
      ...crud("shipping_option"),
      ...crud("shipping_profile"),
      ...crud("fulfillment_set"),
      ...readOnly(
        "seller_member",
        "seller",
        "currency",
        "region",
        "sales_channel",
        "shipping_option_type",
        "fulfillment_provider",
        "file"
      ),
      "file:create",
    ],
  },
  {
    id: SellerRole.ORDER_MANAGEMENT,
    name: "Order Management",
    description: "View and process orders",
    policyKeys: [
      ...crud("order"),
      ...crud("order_change"),
      ...crud("order_claim"),
      ...crud("order_exchange"),
      ...crud("return"),
      ...crud("return_reason"),
      ...crud("refund_reason"),
      ...crud("fulfillment"),
      ...readOnly(
        "seller_member",
        "order_group",
        "customer",
        "customer_group",
        "product",
        "product_variant",
        "offer",
        "inventory_item",
        "stock_location",
        "shipping_option",
        "shipping_profile",
        "payment",
        "seller",
        "region",
        "currency",
        "product_category",
        "product_collection",
        "product_tag",
        "product_type"
      ),
      "file:create",
    ],
  },
  {
    id: SellerRole.ACCOUNTING,
    name: "Accounting",
    description: "View billing and manage payment information",
    policyKeys: [
      ...crud("payout_account"),
      ...readOnly(
        "seller_member",
        "payout",
        "commission_line",
        "commission_rate",
        "commission_rule",
        "payment",
        "order",
        "order_group",
        "return",
        "seller",
        "currency",
        "region"
      ),
    ],
  },
  {
    id: SellerRole.SUPPORT,
    name: "Support",
    description: "Handle customer messages and view orders",
    policyKeys: [
      ...crud("review"),
      ...readOnly(
        "seller_member",
        "order",
        "order_group",
        "order_claim",
        "order_exchange",
        "return",
        "return_reason",
        "customer",
        "customer_group",
        "product",
        "product_variant",
        "offer",
        "seller",
        "shipping_option",
        "payment",
        "region",
        "currency"
      ),
    ],
  },
]

export async function ensureSellerDefaultRoles(
  rbacService: IRbacModuleService
): Promise<RbacRoleDTO[]> {
  const roleIds = SELLER_ROLES.map((role) => role.id)

  const existingRoles = await rbacService.listRbacRoles({ id: roleIds })
  const roleById = new Map(existingRoles.map((role) => [role.id, role]))

  const missingRoles = SELLER_ROLES.filter((role) => !roleById.has(role.id))

  if (missingRoles.length) {
    const createdRoles = await rbacService.createRbacRoles(
      missingRoles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }))
    )

    createdRoles.forEach((role) => {
      roleById.set(role.id, role)
    })
  }

  const policies = await rbacService.listRbacPolicies({})
  const existingRolePolicies = await rbacService.listRbacRolePolicies({
    role_id: roleIds,
  })

  const policyByKey = new Map(policies.map((policy) => [policy.key, policy]))
  const existingBindings = new Set(
    existingRolePolicies.map(
      (rolePolicy) => `${rolePolicy.role_id}:${rolePolicy.policy_id}`
    )
  )

  const rolePoliciesToCreate: { role_id: string; policy_id: string }[] = []

  for (const roleDefinition of SELLER_ROLES) {
    const role = roleById.get(roleDefinition.id)

    if (!role) {
      continue
    }

    const targetPolicies =
      roleDefinition.policyKeys === "*"
        ? policies
        : roleDefinition.policyKeys
            .map((key) => policyByKey.get(key))
            .filter((policy): policy is NonNullable<typeof policy> => !!policy)

    for (const policy of targetPolicies) {
      const bindingKey = `${role.id}:${policy.id}`

      if (existingBindings.has(bindingKey)) {
        continue
      }

      existingBindings.add(bindingKey)
      rolePoliciesToCreate.push({
        role_id: role.id,
        policy_id: policy.id,
      })
    }
  }

  if (rolePoliciesToCreate.length) {
    await rbacService.createRbacRolePolicies(rolePoliciesToCreate)
  }

  return SELLER_ROLES.map((role) => roleById.get(role.id)).filter(
    (role): role is RbacRoleDTO => !!role
  )
}
