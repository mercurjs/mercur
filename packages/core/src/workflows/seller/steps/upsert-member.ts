import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const upsertMembersStep = createStep(
  "upsert-members",
  async (
    data: {
      email: string
      first_name?: string | null
      last_name?: string | null
    }[],
    { container }
  ) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const members = await service.upsertMembers(data)
    return new StepResponse(members)
  }
)
