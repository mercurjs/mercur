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
  res: MedusaResponse<HttpTypes.VendorCurrencyResponse>
) => {
  const { code } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [currency],
  } = await query.graph({
    entity: "currency",
    fields: req.queryConfig.fields,
    filters: { code },
  })

  if (!currency) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Currency with code: ${code} was not found`
    )
  }

  res.json({ currency })
}
