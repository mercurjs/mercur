import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"

import { reportReviewWorkflow } from "../../../../../workflows/review/workflows"
import { validateSellerReview } from "../../helpers"
import { VendorReportReviewType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorReportReviewType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerReview(req.scope, sellerId, id!)

  const { result: report } = await reportReviewWorkflow.run({
    container: req.scope,
    input: {
      review_id: id!,
      seller_id: sellerId,
      reason: req.validatedBody.reason,
    },
  })

  res.status(201).json({ report })
}
