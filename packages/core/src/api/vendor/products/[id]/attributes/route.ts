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
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import { ensureSellerOwnsProduct } from "../../helpers"
import { VendorAddProductAttributeType } from "../../validators"

/**
 * Single-shot workflow used by `POST /vendor/products/:id/attributes`
 * to attach a set of `ProductAttributeValue` rows to a product through
 * the `product_attribute_value_link` pivot.
 */
const attachProductAttributeValuesWorkflow = createWorkflow(
  "vendor-attach-product-attribute-values",
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

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  const { attribute_id: _aid, attribute_value_ids = [], values = [] } =
    req.validatedBody

  // Resolve any free-text `values` against existing attribute values to
  // their ids; values that don't match an existing row are ignored.
  let resolvedIds = attribute_value_ids
  if (values.length) {
    const { data: avs } = await query.graph({
      entity: "product_attribute_value",
      fields: ["id", "name"],
      filters: { attribute_id: req.validatedBody.attribute_id, name: values } as Record<string, unknown>,
    })
    resolvedIds = [
      ...resolvedIds,
      ...avs.map((v: { id: string }) => v.id),
    ]
  }

  if (resolvedIds.length) {
    await attachProductAttributeValuesWorkflow(req.scope).run({
      input: { product_id: productId, value_ids: resolvedIds },
    })
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
