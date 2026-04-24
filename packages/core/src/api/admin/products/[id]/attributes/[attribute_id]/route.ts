import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { removeAttributeFromProductWorkflow } from "../../../../../../workflows/product/workflows/remove-attribute-from-product"
import { updateProductAttributesWorkflow } from "../../../../../../workflows/product/workflows/update-product-attributes"
import { AdminUpdateProductAttributeType } from "../../../../product-attributes/validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const attributeId = req.params.attribute_id

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: attributeId, product_id: req.params.id },
  })

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product attribute with id ${attributeId} was not found for product ${req.params.id}`
    )
  }

  res.json({ product_attribute })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductAttributeDeleteResponse>
) => {
  const productId = req.params.id
  const attributeId = req.params.attribute_id

  await removeAttributeFromProductWorkflow(req.scope).run({
    input: { product_id: productId, attribute_id: attributeId },
  })

  res.status(200).json({
    id: attributeId,
    object: "product_attribute",
    deleted: true,
  })
}
