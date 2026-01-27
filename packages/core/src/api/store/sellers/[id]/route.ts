import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"
import { SellerStatus } from "@mercurjs/types"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.StoreSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    filters: {
      id: req.params.id,
      status: SellerStatus.ACTIVE,
    },
    fields: req.queryConfig.fields,
  })

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id ${req.params.id} was not found`
    )
  }

  res.json({ seller })
}
