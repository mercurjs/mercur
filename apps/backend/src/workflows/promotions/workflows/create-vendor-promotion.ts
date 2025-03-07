import { CreatePromotionDTO } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import {
  createPromotionsWorkflow,
  createRemoteLinkStep
} from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { verifyVendorCampaignStep, verifyVendorPromotionStep } from '../steps'

export const createVendorPromotionWorkflow = createWorkflow(
  'create-vendor-promotion',
  function (input: { promotion: CreatePromotionDTO; seller_id: string }) {
    verifyVendorCampaignStep(input)
    verifyVendorPromotionStep(input)

    const promotions = createPromotionsWorkflow.runAsStep({
      input: {
        promotionsData: [input.promotion]
      }
    })

    const links = transform({ input, promotions }, ({ input, promotions }) =>
      promotions.map((p) => {
        return {
          [SELLER_MODULE]: {
            seller_id: input.seller_id
          },
          [Modules.PROMOTION]: {
            promotion_id: p.id
          }
        }
      })
    )

    createRemoteLinkStep(links)
    return new WorkflowResponse(promotions)
  }
)
