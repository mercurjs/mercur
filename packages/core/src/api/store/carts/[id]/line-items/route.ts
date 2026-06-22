import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { defaultStoreCartFields, refetchCart } from "../../helpers"
import { StoreAddCartLineItemType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse,
) => {
  const cart_id = req.params.id
  const { additional_data, metadata, offer_id, ...item } = req.validatedBody

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id"],
    filters: { id: offer_id },
  })

  const offer = offers[0] as { id: string; variant_id: string } | undefined
  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${offer_id} not found`,
    )
  }

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [
        {
          ...item,
          variant_id: offer.variant_id,
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
