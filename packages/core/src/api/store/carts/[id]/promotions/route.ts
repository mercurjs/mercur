import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { PromotionActions } from "@medusajs/framework/utils"
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers"

import { updateCartSellerPromotionsWorkflow } from "../../../../../workflows/cart/update-cart-seller-promotions"

export const POST = async (
  req: MedusaRequest<HttpTypes.StoreCartAddPromotion, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const payload = req.validatedBody

  await updateCartSellerPromotionsWorkflow(req.scope).run({
    input: {
      promo_codes: payload.promo_codes,
      cart_id: req.params.id,
      action:
        payload.promo_codes.length > 0
          ? PromotionActions.ADD
          : PromotionActions.REPLACE,
      force_refresh_payment_collection: true,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
