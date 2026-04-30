import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"

import ProductModuleService from "../../../../../modules/product/service"

/**
 * Returns the active pending `ProductChange` for the product, or 404 if
 * none exists. Mirrors `GET /admin/products/:id/change` so vendors can
 * inspect the staged-but-unconfirmed change they opened (typical use:
 * "what am I waiting on?" before staging another edit, since only one
 * pending change per product is allowed).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const service = req.scope.resolve<ProductModuleService>(Modules.PRODUCT)

  const product = await service.retrieveProduct(req.params.id)

  if (!product.product_change) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product '${req.params.id}' has no pending change`
    )
  }

  res.json({ product_change: product.product_change })
}
