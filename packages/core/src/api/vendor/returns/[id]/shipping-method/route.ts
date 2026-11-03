import { createReturnShippingMethodWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerReturn } from "../../helpers"
import { validateSellerShippingOption } from "../../../shipping-options/helpers"
import { VendorPostReturnsShippingReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostReturnsShippingReqType>,
  res: MedusaResponse<HttpTypes.VendorReturnPreviewResponse>
) => {
  const { id } = req.params

  await validateSellerReturn(req.scope, req.seller_context!.seller_id, id)
  await validateSellerShippingOption(
    req.scope,
    req.seller_context!.seller_id,
    req.validatedBody.shipping_option_id
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createReturnShippingMethodWorkflow(req.scope).run({
    input: { ...req.validatedBody, return_id: id },
  })

  const {
    data: [orderReturn],
  } = await query.graph({
    entity: "return",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      id,
    },
  })

  res.json({
    order_preview: result,
    return: orderReturn,
  })
}
