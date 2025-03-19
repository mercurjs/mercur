import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { CreateSellerApiKeyDTO } from '../../../modules/seller/types'
import { createSellerApiKeyStep } from '../steps'

export const createSellerApiKeyWorkflow = createWorkflow(
  'create-seller-api-key',
  function (input: CreateSellerApiKeyDTO) {
    const apiKey = createSellerApiKeyStep(input)

    return new WorkflowResponse(apiKey)
  }
)
