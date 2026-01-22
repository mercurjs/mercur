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
  res: MedusaResponse<HttpTypes.VendorSalesChannelResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sales_channel],
  } = await query.graph({
    entity: "sales_channel",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  if (!sales_channel) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Sales channel with id ${req.params.id} was not found`
    )
  }

  res.json({ sales_channel })
}
