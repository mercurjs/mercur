import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { upsertProductAttributeValuesWorkflow } from "../../../../../workflows/product/workflows/upsert-product-attribute-values"
import { AdminUpsertProductAttributeValuesType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpsertProductAttributeValuesType>,
  res: MedusaResponse<HttpTypes.AdminProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await upsertProductAttributeValuesWorkflow(req.scope).run({
    input: {
      attribute_id: req.params.id,
      values: req.validatedBody.values,
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
