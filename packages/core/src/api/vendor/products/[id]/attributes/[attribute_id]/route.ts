import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import {
  detachProductAttributeWorkflow,
} from "../../../../../../workflows/product-attribute"
import { ensureSellerOwnsProduct } from "../../../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const attributeId = req.params.attribute_id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: [
      "attribute_values.id",
      "attribute_values.name",
      "attribute_values.attribute.id",
      "attribute_values.attribute.name",
      "attribute_values.attribute.type",
    ],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const values = (product.attribute_values ?? []).filter(
    (v) => v.attribute?.id === attributeId
  )

  if (!values.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id ${attributeId} was not found on product ${productId}`
    )
  }

  const product_attribute = {
    ...values[0].attribute,
    values: values.map((v: any) => ({ id: v.id, name: v.name })),
  }

  res.json({ product_attribute })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const attributeId = req.params.attribute_id

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  await detachProductAttributeWorkflow(req.scope).run({
    input: { product_id: productId, attribute_id: attributeId },
  })

  res.json({
    id: attributeId,
    object: "product_attribute",
    deleted: true,
  })
}
