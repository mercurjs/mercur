import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes
} from '@medusajs/framework/utils'

import {
  deleteAttributeWorkflow,
  updateAttributesWorkflow
} from '../../../../workflows/attribute/workflows'
import {
  AdminGetAttributeParamsType,
  AdminUpdateAttributeType
} from '../validators'

export const POST = async (
  req: MedusaRequest<AdminUpdateAttributeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const attributeId = req.params.id

  const {
    data: [existingAttribute]
  } = await query.graph({
    entity: 'attribute',
    fields: ['id'],
    filters: {
      id: attributeId
    }
  })

  if (!existingAttribute) {
    throw new MedusaError(
      MedusaErrorTypes.NOT_FOUND,
      `Attribute with id '${attributeId}' not found`
    )
  }

  await updateAttributesWorkflow(req.scope).run({
    input: {
      attributes: [
        {
          ...req.validatedBody,
          id: attributeId,
          product_category_ids:
            req.validatedBody.product_category_ids?.map((id) => ({ id })) ||
            undefined
        }
      ]
    }
  })

  const {
    data: [attribute]
  } = await query.graph({
    entity: 'attribute',
    filters: {
      id: attributeId
    },
    ...req.queryConfig
  })

  return res.json({ attribute })
}

export const GET = async (
  req: MedusaRequest<AdminGetAttributeParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const attributeId = req.params.id

  const {
    data: [attribute]
  } = await query.graph(
    {
      entity: 'attribute',
      ...req.queryConfig,
      filters: {
        id: attributeId
      }
    },
    { throwIfKeyNotFound: true }
  )

  return res.json({ attribute })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const attributeId = req.params.id

  await deleteAttributeWorkflow(req.scope).run({
    input: {
      id: attributeId
    }
  })

  return res.json({
    id: attributeId,
    object: 'attribute',
    deleted: true
  })
}
