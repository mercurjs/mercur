import { CreatePromotionDTO, LinkDefinition } from '@medusajs/framework/types'
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

import { SELLER_MODULE } from '@mercurjs/seller'

import { verifyVendorCampaignStep, verifyVendorPromotionStep } from '../steps'
import { verifyVendorTargetPromotionRulesStep } from '../steps/verify-vendor-target-promotion-rules'

export const createVendorPromotionWorkflow = createWorkflow(
  'create-vendor-promotion',
  function (input: { promotion: CreatePromotionDTO; seller_id: string }) {
    verifyVendorCampaignStep(input)
    verifyVendorPromotionStep(input)
    verifyVendorTargetPromotionRulesStep(
      transform(input, (input) => ({
        rules: input.promotion.application_method.target_rules,
        seller_id: input.seller_id
      }))
    )

    const promotions = createPromotionsWorkflow.runAsStep({
      input: {
        promotionsData: [input.promotion]
      }
    })

    const links = transform({ input, promotions }, ({ input, promotions }) => {
      const promo = promotions[0]
      const link: LinkDefinition[] = [
        {
          [SELLER_MODULE]: {
            seller_id: input.seller_id
          },
          [Modules.PROMOTION]: {
            promotion_id: promo.id
          }
        }
      ]

      if (promo.campaign) {
        link.push({
          [SELLER_MODULE]: {
            seller_id: input.seller_id
          },
          [Modules.PROMOTION]: {
            campaign_id: promo.campaign.id
          }
        })
      }
      return link
    })

    createRemoteLinkStep(links)
    return new WorkflowResponse(promotions)
  }
)
