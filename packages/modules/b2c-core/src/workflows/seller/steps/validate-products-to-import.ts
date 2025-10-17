import { z } from 'zod'

import { ProductStatus } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CreateProduct } from '../../../api/vendor/products/validators'

export const validateProductsToImportStep = createStep(
  'validate-products-to-import',
  async (products: unknown[]) => {
    const toCreate = products.map((product) => ({
      ...CreateProduct.extend({
        status: z.string().optional()
      }).parse(product),
      status: 'proposed' as ProductStatus
    }))

    return new StepResponse(toCreate)
  }
)
