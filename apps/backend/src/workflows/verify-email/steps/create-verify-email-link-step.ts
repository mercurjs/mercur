import { IAuthModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { MedusaError } from '@medusajs/utils'
import { StepResponse, createStep } from '@medusajs/workflows-sdk'

import { generateEmailVerificationJwtToken } from '../../../shared/utils/generate-verify-jwt-email-token'
import { isNil, isNotNil } from '../../../shared/utils/nil'

type CreateVerifyEmailLinkStepInput = {
  authIdentityId: string
	email: string
}

export const createVerifyEmailLinkStep = createStep(
  'create-verify-email-link-step',
  async (input: CreateVerifyEmailLinkStepInput, { container }) => {
    const authIdentityService = container.resolve<IAuthModuleService>(
      Modules.AUTH
    )

    const authIdentity = await authIdentityService.retrieveAuthIdentity(
      input.authIdentityId
    )

    if (isNil(authIdentity)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Auth identity not found'
      )
    }

    if (
      isNotNil(authIdentity.app_metadata) &&
      authIdentity.app_metadata?.email_verified
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Email already verified'
      )
    }

    if (!process.env.JWT_SECRET) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Environmental variable JWT_SECRET is missing'
      )
    }

    const token = await generateEmailVerificationJwtToken(
      input,
      process.env.JWT_SECRET
    )
    const link = `${process.env.FRONTEND_URL}/email/verify-email?token=${token}`

    return new StepResponse({ link })
  }
)
