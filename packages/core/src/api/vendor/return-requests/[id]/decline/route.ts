import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { declineReturnRequestWorkflow } from "../../../../../workflows/return-request/workflows"
import { validateSellerReturnRequest } from "../../helpers"
import { VendorDeclineReturnRequestType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorDeclineReturnRequestType>,
  res: MedusaResponse<HttpTypes.VendorReturnRequestResponse>
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerReturnRequest(req.scope, sellerId, id)

  await declineReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      id,
      ...req.validatedBody,
      declined_by: sellerId,
      declined_by_type: ReturnRequestActorType.SELLER,
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

  res.json({ return_request })
}
