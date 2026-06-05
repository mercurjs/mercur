import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import { syncMeilisearchProductsStep } from '../steps/sync-meilisearch-products'

export const syncMeilisearchWorkflow = createWorkflow(
  'sync-meilisearch-workflow',
  function () {
    return new WorkflowResponse(syncMeilisearchProductsStep())
  }
)
