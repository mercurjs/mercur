import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

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

  const { data: attributes, metadata } = await query.graph({
    entity: 'attribute',
    filters: req.filterableFields,
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
