import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

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
