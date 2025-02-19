import { Modules } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'

import { BRAND_MODULE } from '../../../modules/brand'
import { createBrandStep } from '../steps'

type WorkflowData = { product_id: string; brand_name: string }

export const assignBrandToProductWorkflow = createWorkflow(
  'assign-brand-to-product',
  function (input: WorkflowData) {
    const brand = createBrandStep(input)

    const link = transform({ brand, input }, ({ brand, input }) => {
      return [
        {
          [Modules.PRODUCT]: {
            product_id: input.product_id
          },
          [BRAND_MODULE]: {
            brand_id: brand.id
          }
        }
      ]
    })

    createRemoteLinkStep(link)

    return new WorkflowResponse(link)
  }
)
