import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { acceptReturnRequestWorkflow } from "../../../../../workflows/return-request/workflows"
import { validateSellerReturnRequest } from "../../helpers"
import { VendorAcceptReturnRequestType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAcceptReturnRequestType>,
  res: MedusaResponse<HttpTypes.VendorReturnRequestPreviewResponse>
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerReturnRequest(req.scope, sellerId, id)

  const { result } = await acceptReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      id,
      ...req.validatedBody,
      accepted_by: sellerId,
      accepted_by_type: ReturnRequestActorType.SELLER,
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
