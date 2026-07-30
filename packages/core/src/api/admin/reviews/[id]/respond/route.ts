import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminReviewResponse } from "@mercurjs/types"

import { respondReviewWorkflow } from "../../../../../workflows/review/workflows"
import { AdminRespondReviewType } from "../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<AdminRespondReviewType>,
  res: MedusaResponse<AdminReviewResponse>
): Promise<void> {
  const { id } = req.params

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
