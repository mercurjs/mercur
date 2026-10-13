import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerReturnRequest } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorReturnRequestResponse>
) => {
  const { id } = req.params

  await validateSellerReturnRequest(req.scope, req.seller_context!.seller_id, id)

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
