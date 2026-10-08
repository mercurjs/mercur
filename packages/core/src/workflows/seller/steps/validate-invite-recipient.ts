import { IAuthModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type ValidateInviteRecipientInput = {
  invite_email: string
  auth_identity_id: string
  member_id?: string
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const validateInviteRecipientStep = createStep(
  "validate-invite-recipient",
  async (input: ValidateInviteRecipientInput, { container }) => {
    const emails = new Set<string>()

    if (input.member_id) {
      const sellerService = container.resolve<SellerModuleService>(
        MercurModules.SELLER
      )
      const member = await sellerService.retrieveMember(input.member_id)
      emails.add(normalizeEmail(member.email))
    } else {
      const authService = container.resolve<IAuthModuleService>(Modules.AUTH)
      const identity = await authService.retrieveAuthIdentity(
        input.auth_identity_id,
        { relations: ["provider_identities"] }
      )

      for (const provider of identity.provider_identities ?? []) {
        emails.add(normalizeEmail(provider.entity_id))
        const metadataEmail = provider.user_metadata?.email
        if (typeof metadataEmail === "string") {
          emails.add(normalizeEmail(metadataEmail))
        }
      }
    }

    if (!emails.has(normalizeEmail(input.invite_email))) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Invite can only be accepted by the invited email address"
      )
    }

    return new StepResponse(void 0)
  }
)
