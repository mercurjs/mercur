import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
      ...req.filterableFields,
    },
  })

  const seller = sellers[0]

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id: ${req.params.id} was not found`
    )
  }

  res.json({ seller })
}
