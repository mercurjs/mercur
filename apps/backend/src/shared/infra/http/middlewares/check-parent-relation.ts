import { NextFunction } from 'express'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

type CheckChildParentRelation<Body> = {
  parentResource: string
  childField: string
  childId: (req: AuthenticatedMedusaRequest<Body>) => string
  parentId?: (req: AuthenticatedMedusaRequest<Body>) => string
}

export const checkChildParentRelation = <Body>({
  parentResource,
  childField,
  childId,
  parentId = (req) => req.params.id
}: CheckChildParentRelation<Body>) => {
  return async (
    req: AuthenticatedMedusaRequest<Body>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const child_id = childId(req)
    const parent_id = parentId(req)

    const {
      data: [result]
    } = await query.graph({
      entity: parentResource,
      fields: [childField],
      filters: {
        id: parent_id
      }
    })

    const [child, id] = childField.split('.')
    const values = result[child].map(
      (res: { [x: string]: unknown }) => res[id]
    ) as unknown[]

    if (!values.includes(child_id)) {
      res.status(400).json({
        message: `${child_id} does not belong to ${parent_id}`,
        type: MedusaError.Types.INVALID_DATA
      })
      return
    }

    next()
  }
}
