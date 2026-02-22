import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError, PromotionActions } from "@medusajs/framework/utils"
import { StoreAddCartPromotionsType } from "@medusajs/medusa/api/store/carts/validators"
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { validateSellersPromotions } from "../../../../../modules/seller"

export const POST = async (
    req: AuthenticatedMedusaRequest<StoreAddCartPromotionsType>,
    res: MedusaResponse
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const validatePromotions = await validateSellersPromotions(
      req.validatedBody.promo_codes,
      req.scope,
      req.params.id
    )
    if (!validatePromotions.valid) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Some of the promotion codes are invalid')
    }
    await updateCartPromotionsWorkflow.run({
      container: req.scope,
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