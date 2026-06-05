import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetSellerParamsType } from "../validators"

export const GET = async (
  req: MedusaRequest<StoreGetSellerParamsType>,
  res: MedusaResponse<HttpTypes.StoreSellerResponse>
) => {
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
