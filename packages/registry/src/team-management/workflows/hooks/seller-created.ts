import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IAuthModuleService } from "@medusajs/framework/types"

import { createSellerWorkflow } from "@mercurjs/core-plugin/workflows"
import { MEMBER_MODULE, MemberModuleService } from "../../modules/member"

createSellerWorkflow.hooks.sellerCreated(
  async ({ seller, auth_identity_id }, { container }) => {
    const memberService =
      container.resolve<MemberModuleService>(MEMBER_MODULE)

    const member = await memberService.createMembers({
      seller_id: seller.id,
      name: seller.name,
      role: "owner",
    })

    const authModule =
      container.resolve<IAuthModuleService>(Modules.AUTH)

    const authIdentity = await authModule.retrieveAuthIdentity(auth_identity_id)

    await authModule.updateAuthIdentities({
      id: auth_identity_id,
      app_metadata: {
        ...authIdentity.app_metadata,
        member_id: member.id,
      },
    })

    return new StepResponse(member, {
      member_id: member.id,
      auth_identity_id,
      previous_app_metadata: authIdentity.app_metadata,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const memberService =
      container.resolve<MemberModuleService>(MEMBER_MODULE)

    await memberService.deleteMembers([data.member_id])

    const authModule =
      container.resolve<IAuthModuleService>(Modules.AUTH)

    await authModule.updateAuthIdentities({
      id: data.auth_identity_id,
      app_metadata: data.previous_app_metadata,
    })
  }
)
