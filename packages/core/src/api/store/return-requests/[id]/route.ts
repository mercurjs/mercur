import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateCustomerReturnRequest } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreReturnRequestResponse>
) => {
  const { id } = req.params

  await validateCustomerReturnRequest(req.scope, req.auth_context.actor_id, id)

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
