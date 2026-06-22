import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateAttributesWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-update-attributes"
import { groupProductAttributeValues } from "../../../../../utils/format-product-attributes"
import { VendorUpdateProductAttributeType } from "../../../validators"

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
      "attribute_values.attribute.handle",
      "attribute_values.attribute.type",
      "attribute_values.attribute.is_variant_axis",
    ],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const [product_attribute] = groupProductAttributeValues(
    product.attribute_values,
    { attributeId }
  )

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id ${attributeId} was not found on product ${productId}`
    )
  }

  res.json({
    product_attribute:
      product_attribute as unknown as HttpTypes.VendorProductAttributeResponse["product_attribute"],
  })
}

/**
 * Stages a `remove + add` pair on a single product-change so the new
 * value set replaces the old one atomically. The apply dispatcher
 * processes removes before adds (see
 * `applyProductAttributeChangeActionsWorkflow`), so callers don't have
 * to choreograph two separate requests — and auto-confirm reaches the
 * same end state as the existing DELETE-then-POST integration path.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductAttributeType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const attributeId = req.params.attribute_id
  const body = req.validatedBody

  const { result } = await productEditUpdateAttributesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [
        { type: "remove", attribute_id: attributeId },
        {
          type: "add",
          attribute_id: attributeId,
          value_ids: body.attribute_value_ids,
          values: body.values,
        },
      ],
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: result.id },
  })

  res.status(202).json({ product_change: product_change ?? result })
}

/**
 * Stages an `ATTRIBUTE_REMOVE` action. Auto-confirm dismisses the
 * remote links inline when the flag is off.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const attributeId = req.params.attribute_id

  const { result } = await productEditUpdateAttributesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [{ type: "remove", attribute_id: attributeId }],
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: result.id },
  })

  res.status(202).json({ product_change: product_change ?? result })
}
