import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, PromotionActions } from "@medusajs/framework/utils"
import { StoreAddCartPromotionsType } from "@medusajs/medusa/api/store/carts/validators"
import { updateCartPromotionsInSellerContextWorkflow } from "../../../../../workflows/promotions/workflows/update-cart-promotions-in-seller-context"

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { promo_codes } = req.validatedBody as StoreAddCartPromotionsType;

    await updateCartPromotionsInSellerContextWorkflow(req.scope).run({
      input: {
        cart_id: req.params.id,
        promo_codes: promo_codes,
        action:
            promo_codes.length > 0
                ? PromotionActions.ADD
                : PromotionActions.REPLACE,
        },
    })
  
    const {
      data: [cart]
    } = await query.graph({
      entity: 'cart',
      filters: {
        id: req.params.id
      },
      fields: req.queryConfig.fields
    })
  
    res.json({ cart })
  }