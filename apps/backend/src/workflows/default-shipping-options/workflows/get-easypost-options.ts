import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'

import { getShippingOptionsFromEasyPost } from '../steps'

export const getEasyPostOptions = createWorkflow('get-easypost-options', () => {
  const options = getShippingOptionsFromEasyPost()

  return new WorkflowResponse(options)
})
