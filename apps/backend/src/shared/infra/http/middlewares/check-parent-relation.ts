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

/**
 * Middleware that verifies if the specified entities are in database relationship.
 *
 * @param options - Configuration options for the check
 * @param options.parentResource - The parent entity type
 * @param options.childField - Field to select that indicates the relation
 * @param options.childId - Request parameter containing the child resource ID
 * @param options.parentId - Request parameter containing the parent resource ID (defaults to 'id')
 *
 * @throws {MedusaError} If the child does not belong to the parent resource
 *
 * @example
 * // Basic usage - check if variant belongs to product
 * app.use(checkChildParentRelation({
 *   parentResource: 'product',
 *   childField: 'variants.id',
 *   childId: (req) => req.params.variantId
 * }))
 *
 * @example
 * // Custom field usage - check if inventory item belongs to variant
 * app.use(checkChildParentRelation({
 *   parentResource: 'variant',
 *   childField: 'inventory_items.inventory_item_id',
 *   childId: (req) => req.params.inventoryItemId,
 *   parentId: (req) => req.params.variantId
 * }))
 */
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
