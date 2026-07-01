import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetProductAttributeParamsType } from "../validators"

export const GET = async (
  req: MedusaStoreRequest<StoreGetProductAttributeParamsType>,
  res: MedusaResponse<HttpTypes.StoreProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, id: req.params.id },
  })

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product attribute with id ${req.params.id} was not found`
    )
  }

  res.json({ product_attribute })
}
