import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import categoryAttribute from '../../../../../links/category-attribute'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['categories.id'],
    filters: {
      id: req.params.id
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
    fields: req.queryConfig.fields,
    filters: {
      id: {
        $nin: attributeIds
      }
    }
  })

  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: req.queryConfig.fields.map((field) => `attribute.${field}`),
    filters: {
      product_category_id: categoryIds
    }
  })

  res.json({
    attributes: [
      ...globalAttributes,
      ...categoryAttributes.map((rel) => rel.attribute)
    ]
  })
}
