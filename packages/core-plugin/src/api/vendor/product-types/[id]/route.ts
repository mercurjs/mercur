import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductTypeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_type],
  } = await query.graph({
    entity: "product_type",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  if (!product_type) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product type with id ${req.params.id} was not found`
    )
  }

  res.json({ product_type })
}
