import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addToCartWorkflow } from "../../../../../workflows/cart/workflows/add-to-cart"
import { defaultStoreCartFields, refetchCart } from "../../helpers"
import { StoreAddCartLineItemType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse,
) => {
  const cart_id = req.params.id
  const { additional_data, ...item } = req.validatedBody

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [item],
      additional_data,
    },
  })

  const cart = await refetchCart(cart_id, req.scope, defaultStoreCartFields)
  res.status(200).json({ cart })
}
