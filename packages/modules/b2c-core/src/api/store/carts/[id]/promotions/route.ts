import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError, PromotionActions } from "@medusajs/framework/utils"
import { StoreAddCartPromotionsType } from "@medusajs/medusa/api/store/carts/validators"
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { fetchSellerByAuthActorId } from "@mercurjs/framework"
import { validateSellerPromotions } from "../../../../../modules/seller"

export const POST = async (
    req: AuthenticatedMedusaRequest<StoreAddCartPromotionsType>,
    res: MedusaResponse
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const seller = await fetchSellerByAuthActorId(
      req.auth_context?.actor_id,
      req.scope
    )

    const validatePromotions = await validateSellerPromotions(
      req.validatedBody.promo_codes,
      req.scope,
      seller.id
    )

    if (!validatePromotions.valid) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Some of the promotion codes are invalid')
    }

    await updateCartPromotionsWorkflow.run({
      input: {
        cart_id: req.params.id,
        promo_codes: req.validatedBody.promo_codes,
        action:
            req.validatedBody.promo_codes.length > 0
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