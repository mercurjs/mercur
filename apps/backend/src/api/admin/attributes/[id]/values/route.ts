import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createAttributePossibleValuesWorkflow } from '../../../../../workflows/attribute/workflows'
import {
  AdminCreateAttributeValueType,
  AdminGetAttributeValuesParamsType
} from '../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetAttributeValuesParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: attribute_possible_values, metadata } = await query.graph({
    entity: 'attribute_possible_value',
    filters: {
      attribute_id: req.params.id
    },
    ...req.queryConfig
  })

  res.status(200).json({
    attribute_possible_values,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

export const POST = async (
  req: MedusaRequest<AdminCreateAttributeValueType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const attributeId = req.params.id

  const {
    result: [createdAttributeValue]
  } = await createAttributePossibleValuesWorkflow(req.scope).run({
    input: [
      {
        ...req.validatedBody,
        attribute_id: attributeId
      }
    ]
  })

  const {
    data: [attribute_possible_value]
  } = await query.graph({
    entity: 'attribute_possible_value',
    filters: {
      id: createdAttributeValue.id
    },
    ...req.queryConfig
  })

  return res.status(201).json({ attribute_possible_value })
}
