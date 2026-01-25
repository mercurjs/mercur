import {
  BatchPromotionRulesWorkflowInput,
  batchPromotionRulesWorkflow
} from '@medusajs/medusa/core-flows'
import { createWorkflow, transform, when } from '@medusajs/workflows-sdk'

import {
  verifyVendorTargetPromotionRulesStep,
  ensureSellerProductRuleAfterDeletionStep
} from '../steps'

export const batchVendorPromotionRulesWorkflow = createWorkflow(
  'batch-vendor-promotion-rules',
  function (input: {
    data: BatchPromotionRulesWorkflowInput
    seller_id: string
  }) {
    when(input, (input) => input.data.rule_type === 'target_rules').then(() => {
      verifyVendorTargetPromotionRulesStep(
        transform(input, (input) => ({
          rules: input.data.create,
          seller_id: input.seller_id
        }))
      )
    })

    const batchInputWithDefaultRule = ensureSellerProductRuleAfterDeletionStep(
      transform(input, (input) => ({
        batchInput: input.data,
        seller_id: input.seller_id,
        promotion_id: input.data.id
      }))
    )

    batchPromotionRulesWorkflow.runAsStep({
      input: batchInputWithDefaultRule
    })
  }
)
