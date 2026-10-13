import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { withdrawReturnRequestWorkflow } from "../../../../../workflows/return-request/workflows"
import { validateCustomerReturnRequest } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreReturnRequestResponse>
) => {
  const { id } = req.params

  await validateCustomerReturnRequest(req.scope, req.auth_context.actor_id, id)

  await withdrawReturnRequestWorkflow.run({
    container: req.scope,
    input: { id, customer_id: req.auth_context.actor_id },
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
