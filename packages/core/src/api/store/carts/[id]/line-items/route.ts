import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { defaultStoreCartFields, refetchCart } from "../../helpers"
import { StoreAddCartLineItemType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse,
) => {
  const cart_id = req.params.id
  const { additional_data, ...item } = req.validatedBody

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offerRows } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id", "deleted_at"],
    filters: { id: item.offer_id },
  })
  const offer = (offerRows ?? [])[0] as
    | { id: string; variant_id: string; deleted_at: string | null }
    | undefined

  if (!offer || offer.deleted_at) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${item.offer_id} was not found`,
    )
  }

  const variantId = item.variant_id ?? offer.variant_id

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [{ ...item, variant_id: variantId }],
      additional_data,
    },
  })

  const cart = await refetchCart(cart_id, req.scope, defaultStoreCartFields)
  res.status(200).json({ cart })
}
