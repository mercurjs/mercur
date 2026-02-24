import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { AcceptMemberInviteDTO, MEMBER_MODULE, MemberModuleService } from "../../../modules/member"

export const validateMemberInviteStep = createStep(
  "validate-member-invite",
  async (input: AcceptMemberInviteDTO, { container }) => {
    const service = container.resolve<MemberModuleService>(MEMBER_MODULE)

    const invite = await service.validateInviteToken(input.token)

    return new StepResponse(invite)
  }
)
