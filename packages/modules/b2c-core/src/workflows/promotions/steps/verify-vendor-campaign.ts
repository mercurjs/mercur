import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import sellerCampaign from '../../../links/seller-campaign'

export const verifyVendorCampaignStep = createStep(
  'verify-vendor-campaign',
  async (
    input: {
      promotion: { campaign_id?: string | null }
      seller_id: string
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    if (!input.promotion.campaign_id) {
      return new StepResponse()
    }

    const {
      data: [relation]
    } = await query.graph({
      entity: sellerCampaign.entryPoint,
      fields: ['id'],
      filters: {
        seller_id: input.seller_id,
        campaign_id: input.promotion.campaign_id
      }
    })

    if (!relation) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Vendor Promotion can be linked only to seller own campaign!'
      )
    }
  }
)
