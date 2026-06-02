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
import { AdminAddProductAttributeType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductAttributeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  // Step 1: get value ids attached to this product via the Module-Link
  // joiner alias `attribute_values` (no chained populate path).
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "attribute_values.id"],
    filters: { id: productId },
  })

  if (!products?.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const valueIds: string[] = (
    (products[0] as { attribute_values?: Array<{ id: string }> })
      .attribute_values ?? []
  )
    .map((v) => v.id)
    .filter(Boolean)

  if (!valueIds.length) {
    res.json({
      product_attributes: [],
      count: 0,
      offset: 0,
      limit: 0,
    } as any)
    return
  }

  // Step 2: load values + their parent attributes via the native belongsTo
  // (this is inside the product-attribute module — no joiner crossing).
  const { data: values } = await query.graph({
    entity: "product_attribute_value",
    fields: ["id", "name", "attribute_id"],
    filters: { id: valueIds },
  })

  const attrIds = Array.from(
    new Set(
      ((values as Array<{ attribute_id: string | null }>) ?? [])
        .map((v) => v.attribute_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const { data: attributes } = attrIds.length
    ? await query.graph({
        entity: "product_attribute",
        fields: ["id", "name", "handle", "type", "is_variant_axis"],
        filters: { id: attrIds },
      })
    : { data: [] as Array<{ id: string }> }

  const attributesById = new Map<string, any>()
  for (const attr of attributes as any[]) {
    attributesById.set(attr.id, { ...attr, values: [] })
  }
  for (const v of values as Array<{
    id: string
    name: string
    attribute_id: string | null
  }>) {
    if (!v.attribute_id) continue
    const attr = attributesById.get(v.attribute_id)
    if (!attr) continue
    attr.values.push({ id: v.id, name: v.name })
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
  req: AuthenticatedMedusaRequest<AdminAddProductAttributeType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const body = req.validatedBody

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
