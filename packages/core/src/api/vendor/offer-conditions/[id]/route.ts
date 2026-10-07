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
  res: MedusaResponse<HttpTypes.VendorOfferConditionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [offer_condition],
  } = await query.graph({
    entity: "offer_condition",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id, is_active: true },
  })

  if (!offer_condition) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer condition with id ${req.params.id} was not found`
    )
  }

  res.json({ offer_condition })
}
