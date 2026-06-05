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
  res: MedusaResponse<HttpTypes.VendorPricePreferenceResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [price_preference],
  } = await query.graph({
    entity: "price_preference",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  if (!price_preference) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Price preference with id ${req.params.id} was not found`
    )
  }

  res.json({ price_preference })
}
