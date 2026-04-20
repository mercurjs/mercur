import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductAttributeValuesWorkflow } from "../../../../../workflows/product/workflows/create-product-attribute-values"
import { AdminCreateProductAttributeValueType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductAttributeValueType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...payload } = req.validatedBody

  await createProductAttributeValuesWorkflow(req.scope).run({
    input: {
      attribute_id: req.params.id,
      values: [payload],
    },
  })

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.status(200).json({ product_attribute })
}
