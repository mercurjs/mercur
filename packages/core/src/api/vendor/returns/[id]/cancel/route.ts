import { cancelReturnWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerReturn } from "../../helpers"
import { VendorPostCancelReturnReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostCancelReturnReqType>,
  res: MedusaResponse<HttpTypes.VendorReturnResponse>
) => {
  const { id } = req.params

  await validateSellerReturn(req.scope, req.auth_context.actor_id, id)

  const workflow = cancelReturnWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      ...req.validatedBody,
      return_id: id,
    },
  })

  res.status(200).json({ return: result })
}
