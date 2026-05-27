import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { defaultStoreCartFields, refetchCart } from "../../helpers"
import { StoreAddCartLineItemType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse,
) => {
  const cart_id = req.params.id
  const { additional_data, metadata, offer_id, ...item } = req.validatedBody

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [
        {
          ...item,
          offer_id,
          metadata: { ...(metadata ?? {}), offer_id },
        },
      ],
      additional_data,
    },
  })

  const cart = await refetchCart(cart_id, req.scope, defaultStoreCartFields)
  res.status(200).json({ cart })
}
