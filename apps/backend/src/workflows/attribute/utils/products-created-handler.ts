import { MedusaContainer, ProductDTO } from '@medusajs/framework/types'

import { ProductAttributeValueDTO } from '@mercurjs/framework'

import { createAttributeValueWorkflow } from '../../../workflows/attribute/workflows'

export const productsCreatedHookHandler = async ({
  products,
  additional_data,
  container
}: {
  products: ProductDTO[]
  additional_data: Record<string, unknown> | undefined
  container: MedusaContainer
}) => {
  const attributeValues = (additional_data?.values ??
    []) as ProductAttributeValueDTO[]
  const productIds = products.map((prod) => prod.id)

  if (!attributeValues.length) {
    return []
  }

  await Promise.all(
    productIds.flatMap((prodId) =>
      attributeValues.map(async (attrVal) => {
        return createAttributeValueWorkflow(container).run({
          input: {
            attribute_id: attrVal.attribute_id,
            value: attrVal.value,
            product_id: prodId
          }
        })
      })
    )
  )
}
