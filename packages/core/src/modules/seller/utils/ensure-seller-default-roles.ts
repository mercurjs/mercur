import { IRbacModuleService, RbacRoleDTO } from "@medusajs/types"
import { SellerRole } from "@mercurjs/types"

type SellerRoleDefinition = {
  id: SellerRole
  name: string
  description: string
  policyKeys: "*" | string[]
}

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
    policyKeys: [],
  },
  {
    id: SellerRole.ORDER_MANAGEMENT,
    name: "Order Management",
    description: "View and process orders",
    policyKeys: [],
  },
  {
    id: SellerRole.ACCOUNTING,
    name: "Accounting",
    description: "View billing and manage payment information",
    policyKeys: [],
  },
  {
    id: SellerRole.SUPPORT,
    name: "Support",
    description: "Handle customer messages and view orders",
    policyKeys: [],
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
