import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { acceptReturnRequestWorkflow } from "../../../../../workflows/return-request/workflows"
import { AdminAcceptReturnRequestType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAcceptReturnRequestType>,
  res: MedusaResponse<HttpTypes.AdminReturnRequestPreviewResponse>
) => {
  const { id } = req.params

  const { result } = await acceptReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      id,
      ...req.validatedBody,
      accepted_by: req.auth_context.actor_id,
      accepted_by_type: ReturnRequestActorType.ADMIN,
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

  res.json({ return_request, order_preview: result.order_preview })
}
