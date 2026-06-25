import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"

import { linkSellersToProductWorkflow } from "../../../../../workflows/product/workflows/link-sellers-to-product"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse
) => {
  const { add, remove } = req.validatedBody

  await linkSellersToProductWorkflow(req.scope).run({
    input: { id: req.params.id, add, remove },
  })

  res.status(200).json({ id: req.params.id, object: "product" })
}
