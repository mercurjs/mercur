
import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'
import { syncAlgoliaProductsStep } from '../steps/sync-algolia-products'

export const syncAlgoliaWorkflow = createWorkflow(
  'sync-algolia-workflow',
  function () {
    return new WorkflowResponse(syncAlgoliaProductsStep())
  }
)
