import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IRbacModuleService } from "@medusajs/types"
import { ensureSellerDefaultRoles } from "../../../modules/seller/utils/ensure-seller-default-roles"

export const createSellerDefaultRolesStepId = "create-seller-default-roles"

export const createSellerDefaultRolesStep = createStep(
  createSellerDefaultRolesStepId,
  async (_: void, { container }) => {
    const rbacService: IRbacModuleService = container.resolve(Modules.RBAC)
    const roles = await ensureSellerDefaultRoles(rbacService)

    return new StepResponse(roles)
  },
)
