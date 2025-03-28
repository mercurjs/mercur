import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import SellerModuleService from '../../../modules/seller/service'

export const revokeSellerApiKeyStep = createStep(
  'revoke-seller-api-key',
  async (input: { id: string; revoked_by: string }, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const apiKey = await service.updateSellerApiKeys({
      ...input,
      revoked_at: new Date()
    })

    return new StepResponse(apiKey, apiKey.id)
  }
)
