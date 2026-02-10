import {
  deleteShippingProfileWorkflow,
  updateShippingProfilesWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import {
  refetchShippingProfile,
  validateSellerShippingProfile,
} from "../helpers"
import { VendorUpdateShippingProfileType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingProfileResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerShippingProfile(req.scope, sellerId, req.params.id)

  const shippingProfile = await refetchShippingProfile(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  res.status(200).json({ shipping_profile: shippingProfile })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateShippingProfileType>,
  res: MedusaResponse<HttpTypes.VendorShippingProfileResponse>
) => {
  const sellerId = req.auth_context.actor_id
  const { id } = req.params

  await validateSellerShippingProfile(req.scope, sellerId, id)

  await updateShippingProfilesWorkflow(req.scope).run({
    input: { selector: { id }, update: req.validatedBody },
  })

  const shippingProfile = await refetchShippingProfile(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.status(200).json({ shipping_profile: shippingProfile })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingProfileDeleteResponse>
) => {
  const sellerId = req.auth_context.actor_id
  const { id } = req.params

  await validateSellerShippingProfile(req.scope, sellerId, id)

  await deleteShippingProfileWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "shipping_profile",
    deleted: true,
  })
}
