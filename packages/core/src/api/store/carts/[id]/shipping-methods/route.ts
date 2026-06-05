import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers"
import { addSellerShippingMethodToCartWorkflow } from "../../../../../workflows"

export const POST = async (
  req: MedusaRequest<
    HttpTypes.StoreAddCartShippingMethods & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const payload = req.validatedBody

  await addSellerShippingMethodToCartWorkflow(req.scope).run({
    input: {
      options: [{ id: payload.option_id, data: payload.data }],
      cart_id: req.params.id,
      additional_data: payload.additional_data,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
