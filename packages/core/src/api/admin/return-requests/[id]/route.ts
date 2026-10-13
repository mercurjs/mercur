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
  res: MedusaResponse<HttpTypes.AdminReturnRequestResponse>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [return_request],
  } = await query.graph({
    entity: "return_request",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  if (!return_request) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request with id: ${id} was not found`
    )
  }

  res.json({ return_request })
}
