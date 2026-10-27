import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerFulfillmentSet } from "../../../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorServiceZoneResponse>
) => {
  const { id, zone_id } = req.params
  const sellerId = req.seller_context!.seller_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await validateSellerFulfillmentSet(req.scope, sellerId, id)

  const {
    data: [service_zone],
  } = await query.graph({
    entity: "service_zone",
    filters: { id: zone_id },
    fields: req.queryConfig.fields,
  })

  if (!service_zone) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Service zone with id: ${zone_id} not found`
    )
  }

  res.json({ service_zone })
}
