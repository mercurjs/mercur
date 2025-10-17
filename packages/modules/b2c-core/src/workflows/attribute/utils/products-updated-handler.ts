import { MedusaContainer } from '@medusajs/framework'
import { ProductDTO } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { ProductAttributeValueDTO } from '@mercurjs/framework'

import productAttributeValue from '../../../links/product-attribute-value'
import {
  createAttributeValueWorkflow,
  deleteAttributeValueWorkflow
} from '../../../workflows/attribute/workflows'

export const productsUpdatedHookHandler = async ({
  products,
  additional_data,
  container
}: {
  products: ProductDTO[]
  additional_data: Record<string, unknown> | undefined
  container: MedusaContainer
}) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const attributeValues = (additional_data?.values ??
    []) as ProductAttributeValueDTO[]
  const productIds = products.map((prod) => prod.id)

  if (!attributeValues.length) {
    return []
  }

  const updatedValueIds = (
    await Promise.all(
      productIds.map(async (prodId) => {
        const { data: productValues } = await query.graph({
          entity: productAttributeValue.entryPoint,
          fields: [
            'attribute_value.id',
            'attribute_value.value',
            'attribute_value.attribute_id'
          ],
          filters: {
            product_id: prodId
          }
        })

        return Promise.all(
          attributeValues.map(async (attrVal) => {
            const unchangedProductValue = productValues.find(
              (prodVal) =>
                prodVal.attribute_value.value === attrVal.value &&
                prodVal.attribute_value.attribute_id === attrVal.attribute_id
            )
            if (unchangedProductValue) {
              return unchangedProductValue.attribute_value.id as string
            }

            const { result } = await createAttributeValueWorkflow(
              container
            ).run({
              input: {
                attribute_id: attrVal.attribute_id,
                value: attrVal.value,
                product_id: prodId
              }
            })
            return result.id
          })
        )
      })
    )
  ).flat()

  const { data: attributeValuesToDelete } = await query.graph({
    entity: productAttributeValue.entryPoint,
    fields: ['attribute_value_id'],
    filters: {
      attribute_value_id: {
        $nin: updatedValueIds
      },
      product_id: productIds
    }
  })

  if (!attributeValuesToDelete.length) {
    return
  }

  await deleteAttributeValueWorkflow(container).run({
    input: attributeValuesToDelete.map((val) => val.attribute_value_id)
  })
}
