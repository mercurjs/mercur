import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"

import { deleteProductAttributeValuesWorkflow } from "../../../../../../workflows/product/workflows/delete-product-attribute-values"
import { updateProductAttributeValuesWorkflow } from "../../../../../../workflows/product/workflows/update-product-attribute-values"
import { AdminUpdateProductAttributeValueType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductAttributeValueType & AdditionalData>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { additional_data, ...update } = req.validatedBody

  await updateProductAttributeValuesWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.value_id, attribute_id: req.params.id },
      update,
    },
  })

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ product_attribute })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await deleteProductAttributeValuesWorkflow(req.scope).run({
    input: { ids: [req.params.value_id] },
  })

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ product_attribute })
}
