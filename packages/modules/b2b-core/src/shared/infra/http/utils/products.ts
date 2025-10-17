import { MedusaContainer } from '@medusajs/framework'
import { ProductDTO } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AttributeDTO } from '@mercurjs/framework'

import categoryAttribute from '../../../../links/category-attribute'

export const fetchProductDetails = async (
  product_id: string,
  scope: MedusaContainer
): Promise<ProductDTO> => {
  const service = scope.resolve(Modules.PRODUCT)
  const product = await service.retrieveProduct(product_id)
  return product
}

export async function getApplicableAttributes(
  container: MedusaContainer,
  product_id: string,
  fields: string[]
): Promise<AttributeDTO[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['categories.id'],
    filters: {
      id: product_id
    }
  })
  const categoryIds = product.categories.map((category) => category.id)

  const { data: attributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: ['attribute_id']
  })
  const attributeIds = attributes.map((attribute) => attribute.attribute_id)

  const { data: globalAttributes } = await query.graph({
    entity: 'attribute',
    fields: fields,
    filters: {
      id: {
        $nin: attributeIds
      }
    }
  })

  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: fields.map((field) => `attribute.${field}`),
    filters: {
      product_category_id: categoryIds
    }
  })

  return [
    ...globalAttributes,
    ...categoryAttributes.map((rel) => rel.attribute)
  ]
}
