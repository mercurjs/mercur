import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { updateAttributePossibleValueWorkflow } from '../../../../../../workflows/attribute/workflows'
import {
  AdminGetAttributeValueParamsType,
  AdminUpdateAttributeValueType
} from '../../../validators'

export const GET = async (
  req: MedusaRequest<AdminGetAttributeValueParamsType>,
  res: MedusaResponse
) => {
  const { value_id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [attribute_possible_value]
  } = await query.graph(
    {
      entity: 'attribute_possible_value',
      ...req.queryConfig,
      filters: {
        ...req.filterableFields,
        id: value_id
      }
    },
    { throwIfKeyNotFound: true }
  )

  return res.json({ attribute_possible_value })
}

export const POST = async (
  req: MedusaRequest<AdminUpdateAttributeValueType>,
  res: MedusaResponse
) => {
  const { value_id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateAttributePossibleValueWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      id: value_id
    }
  })

  const {
    data: [attribute_possible_value]
  } = await query.graph({
    entity: 'attribute_possible_value',
    ...req.queryConfig,
    filters: {
      ...req.filterableFields,
      id: value_id
    }
  })

  return res.json({ attribute_possible_value })
}
