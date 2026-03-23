import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"
import { SellerMemberWorkflowEvents } from "../../events"

const validateNotOwnerStep = createStep(
  "validate-not-owner",
  async (seller_member_id: string, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const sellerMember = await service.retrieveSellerMembers(seller_member_id)

    if (sellerMember.is_owner) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot change the role of the owner member"
      )
    }
  }
)

const updateSellerMemberRoleStep = createStep(
  "update-seller-member-role",
  async (
    { seller_member_id, role_id }: { seller_member_id: string; role_id: string },
    { container }
  ) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const prev = await service.retrieveSellerMembers(seller_member_id)
    await service.updateSellerMembers({ id: seller_member_id, role_id })
    return new StepResponse(void 0, { seller_member_id, prev_role_id: prev.role_id })
  },
  async (
    compensationData: { seller_member_id: string; prev_role_id: string | null },
    { container }
  ) => {
    if (!compensationData) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.updateSellerMembers({
      id: compensationData.seller_member_id,
      role_id: compensationData.prev_role_id,
    })
  }
)

export const updateMemberRoleWorkflowId = "update-member-role"

type UpdateMemberRoleWorkflowInput = {
  seller_member_id: string
  role_handle: string
}

export const updateMemberRoleWorkflow = createWorkflow(
  updateMemberRoleWorkflowId,
  function (input: UpdateMemberRoleWorkflowInput) {
    validateNotOwnerStep(input.seller_member_id)

    const { data: role } = useQueryGraphStep({
      entity: "rbac_role",
      fields: ["id"],
      filters: { handle: input.role_handle },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-role" })

    const updateData = transform(
      { input, role },
      ({ input, role }) => ({
        seller_member_id: input.seller_member_id,
        role_id: role[0].id,
      })
    )

    updateSellerMemberRoleStep(updateData)

    emitEventStep({
      eventName: SellerMemberWorkflowEvents.UPDATED,
      data: { seller_member_id: input.seller_member_id },
    })

    return new WorkflowResponse(void 0)
  }
)
