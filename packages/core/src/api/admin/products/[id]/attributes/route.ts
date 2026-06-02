import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AttributeType, HttpTypes, MercurModules } from "@mercurjs/types"

import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
} from "../../../../../workflows/product-attribute/steps"
import { AdminAddProductAttributeType } from "../../validators"

/**
 * Mirror of `POST /vendor/products/:id/attributes` for the operator
 * surface. Admins do not need a seller-ownership check.
 */
const attachProductAttributeValuesWorkflow = createWorkflow(
  "admin-attach-product-attribute-values",
  function (input: { product_id: string; value_ids: string[] }) {
    const links = transform({ input }, ({ input }) =>
      input.value_ids.map((value_id) => ({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_value_id: value_id,
        },
      }))
    )

    createRemoteLinkStep(links as any)
    return new WorkflowResponse(void 0)
  }
)

/**
 * Creates a product-scoped `ProductAttribute` + its values and links the
 * new values to the target product. Mirrors the inline branch the
 * product create/update wrapper takes when its `product_attributes` /
 * `variant_attributes` arrays carry an inline entry — used here so the
 * dedicated "create attribute on this product" drawer can materialise a
 * scoped attribute without an extra round-trip.
 */
const createScopedProductAttributeWorkflow = createWorkflow(
  "admin-create-scoped-product-attribute",
  function (input: {
    product_id: string
    name: string
    type: AttributeType
    is_variant_axis: boolean
    is_filterable: boolean
    is_required: boolean
    description: string | null
    metadata: Record<string, unknown> | null
    value_names: string[]
  }) {
    const createInput = transform({ input }, ({ input }) => [
      {
        product_id: input.product_id,
        name: input.name,
        type: input.type,
        is_variant_axis: input.is_variant_axis,
        is_filterable: input.is_filterable,
        is_required: input.is_required,
        description: input.description,
        metadata: input.metadata,
      },
    ])

    const createdAttrs = createProductAttributesStep(createInput)

    const valuesToCreate = transform(
      { input, createdAttrs },
      ({ input, createdAttrs }) => {
        const attribute_id = createdAttrs[0]?.id as string | undefined
        if (!attribute_id) return []
        return input.value_names.map((name) => ({ name, attribute_id }))
      }
    )

    const createdValues = createProductAttributeValuesStep(valuesToCreate)

    const links = transform(
      { input, createdValues },
      ({ input, createdValues }) =>
        createdValues.map((v) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: v.id as string,
          },
        }))
    )

    createRemoteLinkStep(links as any)
    return new WorkflowResponse(void 0)
  }
)

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

  if (body.name) {
    // Inline-create branch: materialise a product-scoped attribute and
    // link its values to the product.
    await createScopedProductAttributeWorkflow(req.scope).run({
      input: {
        product_id: productId,
        name: body.name,
        type: body.type as AttributeType,
        is_variant_axis: body.is_variant_axis ?? false,
        is_filterable: body.is_filterable ?? false,
        is_required: body.is_required ?? false,
        description: body.description ?? null,
        metadata: body.metadata ?? null,
        value_names: body.values ?? [],
      },
    })
  } else {
    // Attach-existing branch.
    const attribute_id = body.attribute_id as string
    const attribute_value_ids = body.attribute_value_ids ?? []
    const values = body.values ?? []

    let resolvedIds = attribute_value_ids
    if (values.length) {
      const { data: avs } = await query.graph({
        entity: "product_attribute_value",
        fields: ["id", "name"],
        filters: { attribute_id, name: values } as Record<string, unknown>,
      })
      resolvedIds = [...resolvedIds, ...avs.map((v: { id: string }) => v.id)]
    }

    if (resolvedIds.length) {
      await attachProductAttributeValuesWorkflow(req.scope).run({
        input: { product_id: productId, value_ids: resolvedIds },
      })
    }
  }

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.status(201).json({ product })
}
