import { UpdatePromotionDTO } from '@medusajs/framework/types'
import { updatePromotionsWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { verifyVendorCampaignStep } from '../steps'

export const updateVendorPromotionWorkflow = createWorkflow(
  'update-vendor-promotion',
  function (input: { promotion: UpdatePromotionDTO; seller_id: string }) {
    verifyVendorCampaignStep(input)

    const promotions = updatePromotionsWorkflow.runAsStep({
      input: {
        promotionsData: [input.promotion]
      }
    })

    return new WorkflowResponse(promotions)
  }
)
