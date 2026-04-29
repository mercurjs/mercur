import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { productEditAddAttributeWorkflow } from "../../../../../workflows/product-edit/workflows/product-edit-add-attribute"
import { VendorAddProductAttributeType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductAttributeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { data: product_attributes, metadata } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      product_id: productId,
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_attributes,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

/**
 * Stages an `ATTRIBUTE_ADD` action via `product-edit-add-attribute`. Body
 * mirrors `addAttributesToProduct`'s per-item shape so apply-time is a
 * direct passthrough. Returns the created `ProductChange` — the attribute
 * is linked to the product only after an operator confirms the change.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductAttributeType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const { attribute_id, attribute_value_ids, values } = req.validatedBody

  const { result: change } = await productEditAddAttributeWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      attribute_id,
      attribute_value_ids,
      values,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}
