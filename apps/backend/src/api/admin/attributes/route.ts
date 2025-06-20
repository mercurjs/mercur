import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import categoryAttribute from '../../../links/category-attribute'
import { createAttributesWorkflow } from '../../../workflows/attribute/workflows'
import {
  AdminCreateAttributeType,
  AdminGetAttributesParamsType
} from './validators'

export const GET = async (
  req: MedusaRequest<AdminGetAttributesParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { is_global, ...filterableFields } = req.filterableFields

  if (is_global) {
    const { data: attributes } = await query.graph({
      entity: categoryAttribute.entryPoint,
      fields: ['attribute_id']
    })
    const attributeIds = attributes.map((attribute) => attribute.attribute_id)
    filterableFields['id'] = {
      $nin: attributeIds
    }
  }

  const { data: attributes, metadata } = await query.graph({
    entity: 'attribute',
    filters: filterableFields,
    ...req.queryConfig
  })

  return res.json({
    attributes,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

export const POST = async (
  req: MedusaRequest<AdminCreateAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { result } = await createAttributesWorkflow(req.scope).run({
    input: { attributes: [req.validatedBody] }
  })

  const {
    data: [attribute]
  } = await query.graph({
    entity: 'attribute',
    filters: {
      id: result[0].id
    },
    ...req.queryConfig
  })

  res.status(201).json({ attribute })
}
