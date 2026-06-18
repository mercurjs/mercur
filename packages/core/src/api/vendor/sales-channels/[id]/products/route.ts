import { linkProductsToSalesChannelWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes as VendorHttpTypes } from "@mercurjs/types"

import { refetchSalesChannel } from "../../helpers"
import { ensureSellerOwnsProduct } from "../../../products/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse<VendorHttpTypes.VendorSalesChannelResponse>
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody

  // A seller may only link/unlink its own products. Without this guard a
  // seller could attach a competitor's product to a sales channel — the
  // ownership check returns 404 for any product the caller doesn't own.
  const sellerId = req.seller_context!.seller_id
  const productIds = [...(add ?? []), ...(remove ?? [])]
  await Promise.all(
    productIds.map((productId) =>
      ensureSellerOwnsProduct(req.scope, sellerId, productId)
    )
  )

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
