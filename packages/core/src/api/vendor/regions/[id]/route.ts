import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminRegionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [region],
  } = await query.graph({
    entity: "region",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!region) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Region with id ${req.params.id} was not found`
    )
  }

  res.json({ region })
}
