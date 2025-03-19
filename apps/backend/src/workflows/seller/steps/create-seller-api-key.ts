import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import SellerModuleService from '../../../modules/seller/service'
import { CreateSellerApiKeyDTO } from '../../../modules/seller/types'

export const createSellerApiKeyStep = createStep(
  'create-seller-api-key',
  async (input: CreateSellerApiKeyDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const tokenDetails = await service.generateSecretKey()

    const apiKey = await service.createSellerApiKeys({
      ...input,
      salt: tokenDetails.salt,
      token: tokenDetails.hashedToken,
      redacted: tokenDetails.redacted
    })

    return new StepResponse(
      {
        id: apiKey.id,
        token: tokenDetails.plainToken,
        redacted: tokenDetails.redacted,
        ...input
      },
      apiKey.id
    )
  }
)
