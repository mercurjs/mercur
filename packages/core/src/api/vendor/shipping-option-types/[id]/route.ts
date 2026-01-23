import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { refetchShippingOptionType } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingOptionTypeResponse>
) => {
  const shippingOptionType = await refetchShippingOptionType(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  if (!shippingOptionType) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping option type with id "${req.params.id}" not found`
    )
  }

  res.json({ shipping_option_type: shippingOptionType })
}
