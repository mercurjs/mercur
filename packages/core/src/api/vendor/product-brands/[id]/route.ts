import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_brand],
  } = await query.graph({
    entity: "product_brand",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product brand with id ${req.params.id} was not found`
    )
  }

  res.json({ product_brand })
}
