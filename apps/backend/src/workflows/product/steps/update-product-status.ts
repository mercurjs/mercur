import { Modules, ProductStatus } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

/**
 * Updates product status in the product service.
 */
export const updateProductStatusStep = createStep(
  'update-product-status',
  async (input: { id: string; status: ProductStatus }, { container }) => {
    const service = container.resolve(Modules.PRODUCT)

    const product = await service.updateProducts(input.id, {
      status: input.status
    })

    return new StepResponse(product, product.id)
  }
)
