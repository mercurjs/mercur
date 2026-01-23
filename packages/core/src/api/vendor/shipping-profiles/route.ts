import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createSellerShippingProfilesWorkflow } from "../../../workflows/shipping-profile"
import { refetchShippingProfile } from "./helpers"
import { VendorCreateShippingProfileType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorShippingProfileListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_profiles, metadata } = await query.graph({
    entity: "shipping_profile",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    shipping_profiles,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateShippingProfileType>,
  res: MedusaResponse<HttpTypes.VendorShippingProfileResponse>
) => {
  const sellerId = req.auth_context.actor_id

  const { result } = await createSellerShippingProfilesWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      shipping_profiles: [req.validatedBody],
    },
  })

  const shippingProfile = await refetchShippingProfile(
    req.scope,
    result[0].id,
    req.queryConfig.fields
  )

  res.status(201).json({ shipping_profile: shippingProfile })
}
