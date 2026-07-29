import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  StoreReviewDeleteResponse,
  StoreReviewResponse,
} from "@mercurjs/types"

import {
  deleteReviewWorkflow,
  updateReviewWorkflow,
} from "../../../../workflows/review/workflows"
import { validateCustomerReview } from "../helpers"
import { StoreUpdateReviewType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreUpdateReviewType>,
  res: MedusaResponse<StoreReviewResponse>
) => {
  const { id } = req.params

  await validateCustomerReview(req.scope, req.auth_context.actor_id, id!)

  await updateReviewWorkflow.run({
    container: req.scope,
    input: { id: id!, ...req.validatedBody },
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

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreReviewDeleteResponse>
) => {
  const { id } = req.params

  await validateCustomerReview(req.scope, req.auth_context.actor_id, id!)

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

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreReviewResponse>
) => {
  const { id } = req.params

  await validateCustomerReview(req.scope, req.auth_context.actor_id, id!)

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
