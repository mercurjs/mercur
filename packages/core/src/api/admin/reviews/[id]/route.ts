import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AdminReviewDeleteResponse,
  AdminReviewResponse,
} from "@mercurjs/types"

import {
  deleteReviewWorkflow,
  updateReviewWorkflow,
} from "../../../../workflows/review/workflows"
import { AdminUpdateReviewType } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminReviewResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [review],
  } = await query.graph({
    entity: "review",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  res.json({ review })
}

export async function POST(
  req: AuthenticatedMedusaRequest<AdminUpdateReviewType>,
  res: MedusaResponse<AdminReviewResponse>
): Promise<void> {
  const { id } = req.params

  await updateReviewWorkflow.run({
    container: req.scope,
    input: { id, ...req.validatedBody },
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

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminReviewDeleteResponse>
): Promise<void> {
  const { id } = req.params

  await deleteReviewWorkflow.run({
    container: req.scope,
    input: id!,
  })

  res.json({
    id: id!,
    object: "review",
    deleted: true,
  })
}
