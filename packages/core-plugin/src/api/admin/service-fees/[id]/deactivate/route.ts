import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { deactivateServiceFeeWorkflow } from "../../../../../workflows/service-fee"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminServiceFeeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await deactivateServiceFeeWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      changed_by: req.auth_context?.actor_id,
    },
  })

  const {
    data: [service_fee],
  } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ service_fee })
}
