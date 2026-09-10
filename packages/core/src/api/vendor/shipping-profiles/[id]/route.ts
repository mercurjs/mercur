import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { refetchShippingProfile } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingProfileResponse>
) => {
  const shippingProfile = await refetchShippingProfile(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  if (!shippingProfile) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping profile with id: ${req.params.id} was not found`
    )
  }

  res.status(200).json({ shipping_profile: shippingProfile })
}
