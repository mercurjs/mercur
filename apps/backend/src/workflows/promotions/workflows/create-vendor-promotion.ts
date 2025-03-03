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

export const createVendorPromotionWorkflow = createWorkflow(
  'create-vendor-promotion',
  function (input: { promotion: any; seller_id: string }) {
    const promotions = createPromotionsWorkflow.runAsStep({
      input: input.promotion
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
