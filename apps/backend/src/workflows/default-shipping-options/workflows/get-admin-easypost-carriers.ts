import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { getShippingOptionsFromExternalProviderStep } from '../steps'

export const getAdminCarriersList = createWorkflow(
  'get-admin-carriers-list',
  () => {
    const carriers = getShippingOptionsFromExternalProviderStep()

    return new WorkflowResponse(carriers)
  }
)
