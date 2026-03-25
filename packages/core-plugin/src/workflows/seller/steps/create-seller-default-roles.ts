import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"
import { SellerRole } from "@mercurjs/types"

// todo: update policy keys on roles
const SELLER_ROLES = [
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

export const createSellerDefaultRolesStepId = "create-seller-default-roles"

export const createSellerDefaultRolesStep = createStep(
  createSellerDefaultRolesStepId,
  async (_: void, { container }) => {
    const rbacService: IRbacModuleService = container.resolve(Modules.RBAC)

    const existingRoles = await rbacService.listRbacRoles({
      id: SELLER_ROLES.map((r) => r.id),
    })

    if (existingRoles.length > 0) {
      return new StepResponse(existingRoles)
    }

    const createdRoles = await rbacService.createRbacRoles(
      SELLER_ROLES.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
      }))
    )

    const allPolicyKeys = [
      ...new Set(
        SELLER_ROLES.flatMap((r) =>
          r.policyKeys === "*" ? [] : r.policyKeys
        )
      ),
    ]

    const policies = await rbacService.listRbacPolicies(
      allPolicyKeys.length > 0 ? { key: allPolicyKeys } : {}
    )

    const policyByKey = new Map(policies.map((p) => [p.key, p]))

    const rolePolicies: { role_id: string; policy_id: string }[] = []

    for (let i = 0; i < SELLER_ROLES.length; i++) {
      const roleDef = SELLER_ROLES[i]
      const createdRole = createdRoles[i]

      if (roleDef.policyKeys === "*") {
        for (const policy of policies) {
          rolePolicies.push({
            role_id: createdRole.id,
            policy_id: policy.id,
          })
        }
      } else {
        for (const key of roleDef.policyKeys) {
          const policy = policyByKey.get(key)
          if (policy) {
            rolePolicies.push({
              role_id: createdRole.id,
              policy_id: policy.id,
            })
          }
        }
      }
    }

    if (rolePolicies.length > 0) {
      await rbacService.createRbacRolePolicies(rolePolicies)
    }

    return new StepResponse(
      createdRoles,
    )
  },
)
