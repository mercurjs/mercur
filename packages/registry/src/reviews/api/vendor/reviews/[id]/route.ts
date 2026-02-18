import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorReviewResponse } from '../../../../modules/reviews/types'
import { updateReviewWorkflow } from '../../../../workflows/review/workflows'
import { validateSellerReview } from '../helpers'
import { VendorUpdateReviewType } from '../validators'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorReviewResponse>
) => {
  const { id } = req.params

  await validateSellerReview(req.scope, req.auth_context.actor_id, id!)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [review]
  } = await query.graph({
    entity: 'review',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({
    review
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateReviewType>,
  res: MedusaResponse<VendorReviewResponse>
) => {
  const { id } = req.params

  await validateSellerReview(req.scope, req.auth_context.actor_id, id!)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateReviewWorkflow.run({
    container: req.scope,
    input: { id, ...req.validatedBody }
  })

  const {
    data: [review]
  } = await query.graph({
    entity: 'review',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({
    review
  })
}
