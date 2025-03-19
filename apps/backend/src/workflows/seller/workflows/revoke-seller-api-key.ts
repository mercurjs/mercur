import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { revokeSellerApiKeyStep } from '../steps'

export const revokeSellerApiKeyWorkflow = createWorkflow(
  'revoke-seller-api-key',
  function (input: { id: string; revoked_by: string }) {
    const apiKey = revokeSellerApiKeyStep(input)

    return new WorkflowResponse(apiKey)
  }
)
