import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const createSellerMembersStep = createStep(
  "create-seller-members",
  async (
    data: { seller_id: string; member_id: string; role_id?: string; is_owner?: boolean }[],
    { container }
  ) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    const sellerMembers = await service.createSellerMembers(data)
    return new StepResponse(
      sellerMembers,
      sellerMembers.map((sm) => sm.id)
    )
  },
  async (ids: string[], { container }) => {
    if (!ids) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)
    await service.deleteSellerMembers(ids)
  }
)
