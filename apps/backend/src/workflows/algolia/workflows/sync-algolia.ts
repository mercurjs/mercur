import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { syncAlgoliaProductsStep } from '../steps'

/**
 * Synchronizes products with Algolia search service.
 */
export const syncAlgoliaWorkflow = createWorkflow(
  'sync-algolia-workflow',
  function () {
    return new WorkflowResponse(syncAlgoliaProductsStep())
  }
)
