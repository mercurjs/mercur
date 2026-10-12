import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  isValidHandle,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorGetSellerHandleAvailabilityParamsType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetSellerHandleAvailabilityParamsType>,
  res: MedusaResponse<HttpTypes.VendorSellerHandleAvailabilityResponse>
) => {
  const { handle } =
    req.validatedQuery as VendorGetSellerHandleAvailabilityParamsType

  if (!isValidHandle(handle)) {
    return res.json({ handle, available: false, reason: "invalid" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { handle },
    pagination: { take: 1, skip: 0 },
  })

  res.json(
    sellers.length
      ? { handle, available: false, reason: "taken" }
      : { handle, available: true }
  )
}
