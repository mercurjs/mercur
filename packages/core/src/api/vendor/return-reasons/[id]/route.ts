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
  res: MedusaResponse<HttpTypes.VendorReturnReasonResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [return_reason],
  } = await query.graph({
    entity: "return_reason",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  if (!return_reason) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return reason with id ${req.params.id} was not found`
    )
  }

  res.json({ return_reason })
}
