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
  res: MedusaResponse<HttpTypes.VendorProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product attribute with id ${req.params.id} was not found`
    )
  }

  res.json({ product_attribute })
}
