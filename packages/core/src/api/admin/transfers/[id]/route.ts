import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminTransferResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [transfer],
  } = await query.graph({
    entity: "transfer",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })
  if (!transfer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Transfer ${req.params.id} was not found`)
  }
  res.json({ transfer })
}
