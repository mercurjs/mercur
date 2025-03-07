import { CreatePriceListWorkflowInputDTO } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import {
  createPriceListsWorkflow,
  createRemoteLinkStep
} from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { SELLER_MODULE } from '../../../modules/seller'
import { validateVendorPriceListPricesStep } from '../steps'

export const createVendorPriceListWorkflow = createWorkflow(
  'create-vendor-price-list',
  function ({
    price_list_data,
    seller_id
  }: {
    price_list_data: CreatePriceListWorkflowInputDTO
    seller_id: string
  }) {
    validateVendorPriceListPricesStep({
      prices: price_list_data.prices,
      seller_id
    })

    const result = createPriceListsWorkflow.runAsStep({
      input: {
        price_lists_data: [price_list_data]
      }
    })

    const links = transform(result, (result) => {
      return result.map((list) => {
        return {
          [SELLER_MODULE]: {
            seller_id: seller_id
          },
          [Modules.PRICING]: {
            price_list_id: list.id
          }
        }
      })
    })

    createRemoteLinkStep(links)
    return new WorkflowResponse(result)
  }
)
