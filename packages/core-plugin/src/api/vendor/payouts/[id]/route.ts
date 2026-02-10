import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerPayout } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPayoutResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  await validateSellerPayout(req.scope, sellerId, req.params.id)

  const {
    data: [payout],
  } = await query.graph({
    entity: "payout",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!payout) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payout with id ${req.params.id} was not found`
    )
  }

  res.json({ payout })
}
