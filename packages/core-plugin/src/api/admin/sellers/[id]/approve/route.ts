import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { approveSellerWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  await approveSellerWorkflow(req.scope).run({
    input: {
      seller_id: req.params.id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ seller })
}
