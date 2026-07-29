import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { VendorReviewResponse } from "@mercurjs/types"

import { respondReviewWorkflow } from "../../../../workflows/review/workflows"
import { validateSellerReview } from "../helpers"
import { VendorRespondReviewType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorReviewResponse>
) => {
  const { id } = req.params

  await validateSellerReview(req.scope, req.seller_context!.seller_id, id!)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [review],
  } = await query.graph({
    entity: "review",
    fields: req.queryConfig.fields,
    filters: {
      id,
    },
  })

  res.json({ review })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorRespondReviewType>,
  res: MedusaResponse<VendorReviewResponse>
) => {
  const { id } = req.params

  await validateSellerReview(req.scope, req.seller_context!.seller_id, id!)

  await respondReviewWorkflow.run({
    container: req.scope,
    input: { id: id!, seller_note: req.validatedBody.seller_note },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [review],
  } = await query.graph({
    entity: "review",
    fields: req.queryConfig.fields,
    filters: {
      id,
    },
  })

  res.json({ review })
}
