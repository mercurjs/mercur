import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminUpsertSellerPaymentDetailsType } from "../../validators"
import { updateSellerPaymentDetailsWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpsertSellerPaymentDetailsType>,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  const { additional_data, ...data } = req.validatedBody

  await updateSellerPaymentDetailsWorkflow(req.scope).run({
    input: {
      seller_id: req.params.id,
      data,
      additional_data,
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
