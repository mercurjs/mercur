import { linkProductsToSalesChannelWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes as VendorHttpTypes } from "@mercurjs/types"

import { refetchSalesChannel } from "../../helpers"
import { validateSellerProducts } from "../../../product-categories/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse<VendorHttpTypes.VendorSalesChannelResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id
  const { add, remove } = req.validatedBody

  const productIdsToValidate = [...(add || []), ...(remove || [])]

  await validateSellerProducts(req.scope, sellerId, productIdsToValidate)

  await linkProductsToSalesChannelWorkflow(req.scope).run({
    input: {
      id,
      add,
      remove,
    },
  })

  const sales_channel = await refetchSalesChannel(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ sales_channel })
}
