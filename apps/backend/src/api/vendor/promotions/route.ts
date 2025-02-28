import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createPromotionsWorkflow } from '@medusajs/medusa/core-flows'

import sellerPromotion from '../../../links/seller-promotion'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: promotions, metadata } = await query.graph({
    entity: sellerPromotion.entryPoint,
    fields: req.remoteQueryConfig.fields.map((field) => `promotion.${field}`),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    promotions: promotions.map((relation) => relation.promotion),
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await createPromotionsWorkflow.run({
    input: {
      promotionsData: [{}]
    }
  })
}
