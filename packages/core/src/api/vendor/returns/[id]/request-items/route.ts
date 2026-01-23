import { requestItemReturnWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerReturn } from "../../helpers"
import { VendorPostReturnsRequestItemsReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostReturnsRequestItemsReqType>,
  res: MedusaResponse<HttpTypes.VendorReturnPreviewResponse>
) => {
  const { id } = req.params

  await validateSellerReturn(req.scope, req.auth_context.actor_id, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await requestItemReturnWorkflow(req.scope).run({
    input: { ...req.validatedBody, return_id: id },
  })

  const {
    data: [orderReturn],
  } = await query.graph({
    entity: "return",
    fields: req.queryConfig.fields,
    filters: {
      id,
      ...req.filterableFields,
    },
  })

  res.json({
    order_preview: result,
    return: orderReturn,
  })
}
