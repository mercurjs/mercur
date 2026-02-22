import {
  CreatePriceListPriceWorkflowDTO,
  UpdatePriceListPriceWorkflowDTO
} from '@medusajs/framework/types'
import { batchPriceListPricesWorkflow } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { validateVendorPriceListPricesStep } from '../steps'

type WorkflowInput = {
  id: string
  seller_id: string
  delete: string[]
  create: CreatePriceListPriceWorkflowDTO[]
  update: UpdatePriceListPriceWorkflowDTO[]
}

export const batchVendorPriceListPricesWorkflow = createWorkflow(
  'batch-vendor-price-list-prices',
  function (input: WorkflowInput) {
    validateVendorPriceListPricesStep({
      create: input.create,
      update: input.update,
      price_list_id: input.id,
      seller_id: input.seller_id
    })

    const result = batchPriceListPricesWorkflow.runAsStep({
      input: {
        data: {
          id: input.id,
          create: input.create,
          update: input.update,
          delete: input.delete
        }
      }
    })
    return new WorkflowResponse(result)
  }
)
