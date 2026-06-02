import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AttributeType, HttpTypes } from "@mercurjs/types"

import { addProductAttributeWorkflow } from "../../../../../workflows/product-attribute/workflows"
import { ensureSellerOwnsProduct } from "../../helpers"
import { VendorAddProductAttributeType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductAttributeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id", "attribute_values.attribute.id", "attribute_values.attribute.name"],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const attributesById = new Map<string, any>()
  for (const v of (product as any).attribute_values ?? []) {
    if (!v.attribute) continue
    if (!attributesById.has(v.attribute.id)) {
      attributesById.set(v.attribute.id, v.attribute)
    }
  }
  const product_attributes = Array.from(attributesById.values())

  res.json({
    product_attributes,
    count: product_attributes.length,
    offset: 0,
    limit: product_attributes.length,
  } as any)
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductAttributeType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const body = req.validatedBody

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  await addProductAttributeWorkflow(req.scope).run({
    input: {
      product_id: productId,
      attribute_id: body.attribute_id,
      value_ids: body.attribute_value_ids,
      name: body.name,
      type: body.type as AttributeType | undefined,
      values: body.values,
      is_variant_axis: body.is_variant_axis,
      is_filterable: body.is_filterable,
      is_required: body.is_required,
      description: body.description ?? null,
      metadata: body.metadata ?? null,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.status(201).json({ product })
}
