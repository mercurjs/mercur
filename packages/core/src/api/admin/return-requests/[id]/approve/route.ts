import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { approveReturnRequestWorkflow } from "../../../../../workflows/return-request/workflows"
import { AdminApproveReturnRequestType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminApproveReturnRequestType>,
  res: MedusaResponse<HttpTypes.AdminReturnRequestResponse>
) => {
  const { id } = req.params

  await approveReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      id,
      ...req.validatedBody,
      approved_by: req.auth_context.actor_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [return_request],
  } = await query.graph({
    entity: "return_request",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  res.json({ return_request })
}
