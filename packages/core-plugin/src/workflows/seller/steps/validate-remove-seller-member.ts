import { createStep } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { MercurModules, SellerMemberDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const validateRemoveSellerMemberStep = createStep(
  "validate-remove-seller-member",
  async (
    { seller_member_id }: { seller_member_id: string },
    { container }
  ) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const sellerMember: SellerMemberDTO = await service.retrieveSellerMember(seller_member_id)

    if (sellerMember.is_owner) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot remove the owner member from a seller"
      )
    }
  }
)
