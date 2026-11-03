import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const validateMemberEmailAvailableStep = createStep(
  "validate-member-email-available",
  async (input: { email: string }, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [existing] = await service.listMembers(
      { email: input.email },
      { select: ["id"], take: 1 }
    )

    if (existing) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "A member with this email already exists. Sign in with that account to create a store"
      )
    }

    return new StepResponse(void 0)
  }
)
