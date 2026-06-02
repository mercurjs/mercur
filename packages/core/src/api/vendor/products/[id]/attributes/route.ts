import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AttributeType, HttpTypes, ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateAttributesWorkflow } from "../../../../../workflows/product-edit/workflows/product-edit-update-attributes"
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

/**
 * Stages an `ATTRIBUTE_ADD` action. Supports both branches the
 * validator allows: attach-existing (`attribute_id` + `value_ids` /
 * `values`) and inline-create (`name` + `type` + `values`). The
 * staging workflow resolves names → ids and creates inline
 * `ProductAttribute` rows up-front so the action carries pre-resolved
 * `attribute_value_ids` (the apply-actions contract).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductAttributeType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const body = req.validatedBody

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  const op =
    body.attribute_id !== undefined
      ? ({
          type: "add" as const,
          attribute_id: body.attribute_id,
          value_ids: body.attribute_value_ids,
          values: body.values,
        })
      : ({
          type: "add" as const,
          name: body.name!,
          attribute_type: body.type as AttributeType,
          values: body.values ?? [],
          is_variant_axis: body.is_variant_axis,
          is_filterable: body.is_filterable,
          is_required: body.is_required,
          description: body.description ?? null,
          metadata: body.metadata ?? null,
        })

  const { result } = await productEditUpdateAttributesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [op],
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
