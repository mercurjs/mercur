import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { AdminRequestResponse } from "../../../../../types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminRequestResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const alias = req.params.type!

  const {
    data: [entity],
  } = await query.graph({
    entity: alias,
    fields: ["id", "custom_fields.*", ...req.queryConfig.fields],
    filters: { id: req.params.id },
  })

  if (!entity) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Request not found")
  }

  res.json({ request: entity })
}
