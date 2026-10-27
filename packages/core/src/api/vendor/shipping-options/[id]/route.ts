import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import {
  deleteSellerShippingOptionsWorkflow,
  updateSellerShippingOptionWorkflow,
  UpdateSellerShippingOptionWorkflowInput,
} from "../../../../workflows/shipping-rule"
import { refetchShippingOption, validateSellerShippingOption } from "../helpers"
import { validateSellerRegionPrices } from "../../regions/helpers"
import { VendorUpdateShippingOptionType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingOptionResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  await validateSellerShippingOption(req.scope, sellerId, req.params.id)

  const shippingOption = await refetchShippingOption(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  if (!shippingOption) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping Option with id: ${req.params.id} not found`
    )
  }

  res.json({ shipping_option: shippingOption })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateShippingOptionType>,
  res: MedusaResponse<HttpTypes.VendorShippingOptionResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  await validateSellerShippingOption(req.scope, sellerId, req.params.id)

  const shippingOptionPayload = req.validatedBody

  await validateSellerRegionPrices(
    req.scope,
    sellerId,
    shippingOptionPayload.prices ?? []
  )

  const { result } = await updateSellerShippingOptionWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      update: shippingOptionPayload as UpdateSellerShippingOptionWorkflowInput["update"],
    },
  })

  const shippingOption = await refetchShippingOption(
    req.scope,
    result[0].id,
    req.queryConfig.fields
  )

  res.status(200).json({ shipping_option: shippingOption })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingOptionDeleteResponse>
) => {
  const sellerId = req.seller_context!.seller_id
  const shippingOptionId = req.params.id

  await validateSellerShippingOption(req.scope, sellerId, shippingOptionId)

  await deleteSellerShippingOptionsWorkflow(req.scope).run({
    input: { seller_id: sellerId, ids: [shippingOptionId] },
  })

  res
    .status(200)
    .json({ id: shippingOptionId, object: "shipping_option", deleted: true })
}
