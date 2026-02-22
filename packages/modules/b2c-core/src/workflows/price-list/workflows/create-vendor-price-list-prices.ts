import { CreatePriceListPriceWorkflowDTO } from '@medusajs/framework/types'
import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk'
import { createPriceListPricesWorkflow } from '@medusajs/medusa/core-flows'

import { validateVendorPriceListPricesStep } from '../steps'

export const createVendorPriceListPricesWorkflow = createWorkflow(
  'create-vendor-prices-list',
  function ({
    prices,
    price_list_id,
    seller_id
  }: {
    prices: CreatePriceListPriceWorkflowDTO[]
    price_list_id: string
    seller_id: string
  }) {
    validateVendorPriceListPricesStep({ create: prices, seller_id })
    const result = createPriceListPricesWorkflow.runAsStep({
      input: {
        data: [
          {
            id: price_list_id,
            prices
          }
        ]
      }
    })

    return new WorkflowResponse(result)
  }
)
