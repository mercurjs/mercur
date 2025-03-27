import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { VendorCreateProduct } from '../../../api/vendor/products/validators'

export const validateProductsToImportStep = createStep(
  'validate-products-to-import',
  async (products: unknown[]) => {
    const toCreate = products.map((product) => ({
      ...VendorCreateProduct.parse(product),
      status: 'proposed'
    }))

    return new StepResponse(toCreate)
  }
)
