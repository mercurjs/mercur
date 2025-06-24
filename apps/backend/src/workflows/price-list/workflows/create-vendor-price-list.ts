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

import { SELLER_MODULE } from '@mercurjs/seller'

import { validateVendorPriceListPricesStep } from '../steps'

export const createVendorPriceListWorkflow = createWorkflow(
  'create-vendor-price-list',
  function ({
    price_lists_data,
    seller_id
  }: {
    price_lists_data: CreatePriceListWorkflowInputDTO
    seller_id: string
  }) {
    validateVendorPriceListPricesStep({
      create: price_lists_data.prices,
      seller_id
    })

    const result = createPriceListsWorkflow.runAsStep({
      input: {
        price_lists_data: [price_lists_data]
      }
    })

    const links = transform({ result, seller_id }, ({ result, seller_id }) => {
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
