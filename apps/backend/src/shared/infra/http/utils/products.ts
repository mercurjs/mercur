import { MedusaContainer } from '@medusajs/framework'
import { ProductDTO } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export const fetchProductDetails = async (
  product_id: string,
  scope: MedusaContainer
): Promise<ProductDTO> => {
  const service = scope.resolve(Modules.PRODUCT)
  const product = await service.retrieveProduct(product_id)
  return product
}
