import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminApproveSellerType } from "../../validators"
import { approveSellerWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminApproveSellerType>,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  await approveSellerWorkflow(req.scope).run({
    input: {
      seller_id: req.params.id,
      additional_data: req.validatedBody.additional_data,
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
