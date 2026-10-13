import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { declineReturnRequestWorkflow } from "../../../../../workflows/return-request/workflows"
import { AdminDeclineReturnRequestType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminDeclineReturnRequestType>,
  res: MedusaResponse<HttpTypes.AdminReturnRequestResponse>
) => {
  const { id } = req.params

  await declineReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      id,
      ...req.validatedBody,
      declined_by: req.auth_context.actor_id,
      declined_by_type: ReturnRequestActorType.ADMIN,
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
