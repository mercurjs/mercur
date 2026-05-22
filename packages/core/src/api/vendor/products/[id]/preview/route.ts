import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"

import ProductModuleService from "../../../../../modules/product/service"

/**
 * Returns the active pending `ProductChange` for a product the seller owns.
 * Vendors can browse the master catalog (published products from other
 * sellers) via the products list, but those products are not owned by them
 * and therefore never carry a vendor-visible pending change. In that case
 * the endpoint returns `product_change: null` instead of 404 so the UI can
 * render the master product without erroring.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO | null }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { data: ownership } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id: sellerId, product_id: productId },
  })

  if (!ownership.length) {
    res.json({ product_change: null })
    return
  }

  const service = req.scope.resolve<ProductModuleService>(Modules.PRODUCT)
  const product = await service.retrieveProduct(productId)

  res.json({ product_change: product.product_change ?? null })
}
