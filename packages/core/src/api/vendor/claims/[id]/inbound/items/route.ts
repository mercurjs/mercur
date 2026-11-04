import { orderClaimRequestItemReturnWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"

import { validateSellerStockLocations } from "../../../../stock-locations/helpers"
import { VendorPostClaimsRequestReturnItemsReqType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostClaimsRequestReturnItemsReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  await validateSellerStockLocations(
    req.scope,
    req.seller_context!.seller_id,
    req.validatedBody.location_id ? [req.validatedBody.location_id] : []
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [claim],
  } = await query.graph({
    entity: "order_claim",
    filters: { id },
    fields: ["id", "return_id"],
  })

  const { result } = await orderClaimRequestItemReturnWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      return_id: claim.return_id,
      claim_id: id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
