import { createWorkflow, WorkflowData, transform } from "@medusajs/framework/workflows-sdk"
import { UpdateCartPromotionsWorkflowInput, useQueryGraphStep, updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { cartFieldsForPromoApply } from "../utils/cart-fields-for-promo-apply"

export const updateCartPromotionsInSellerContextWorkflow = createWorkflow(
    {
      name: "update-cart-promotions-in-seller-context",
      idempotent: false,
    },
    (input: WorkflowData<UpdateCartPromotionsWorkflowInput>) => {
      const { data: fetchedCart } = useQueryGraphStep({
        entity: "cart",
        fields: cartFieldsForPromoApply,
        filters: { id: input.cart_id },
        options: { isList: false },
      }).config({ name: "fetch-cart-with-seller" })

      const enrichedInput = transform({ input, fetchedCart }, ({ input, fetchedCart }) => ({
        ...input,
        cart: fetchedCart,
      }))

      return updateCartPromotionsWorkflow.runAsStep({
        input: enrichedInput,
      })
    }
  )