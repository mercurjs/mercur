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
  res: MedusaResponse<HttpTypes.VendorProductTagResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_tag],
  } = await query.graph({
    entity: "product_tag",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  })

  if (!product_tag) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product tag with id ${req.params.id} was not found`
    )
  }

  res.json({ product_tag })
}
