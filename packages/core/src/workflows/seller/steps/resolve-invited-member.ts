import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type ResolveInvitedMemberStepInput = {
  email: string
  member_id?: string
}

export const resolveInvitedMemberStep = createStep(
  "resolve-invited-member",
  async (input: ResolveInvitedMemberStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [existing] = await service.listMembers(
      { email: input.email },
      { select: ["id", "email"], take: 1 }
    )

    if (input.member_id) {
      if (!existing || existing.id !== input.member_id) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "This invite was issued to a different member"
        )
      }

      return new StepResponse(void 0)
    }

    if (existing) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "A member with this email already exists. Sign in with that account to accept the invite"
      )
    }

    return new StepResponse(void 0)
  }
)
