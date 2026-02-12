import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"
import { wrapCollectionsWithProducts } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCollectionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const withProducts = req.queryConfig.fields.some((field) =>
    field.includes("products")
  )

  const {
    data: [collection],
  } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields.filter(field => !field.includes("products")),
    filters: {
      id: req.params.id,
    },
  })

  if (!collection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Collection with id ${req.params.id} was not found`
    )
  }

  if (withProducts) {
    await wrapCollectionsWithProducts([collection], req)
  }

  res.json({ collection })
}
