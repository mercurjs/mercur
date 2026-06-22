import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateAttributesWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-update-attributes"
import { ensureSellerOwnsProduct } from "../../../helpers"
import { VendorBatchProductAttributesType } from "../../../validators"

/**
 * Stages a batch of `ATTRIBUTE_ADD` / `ATTRIBUTE_REMOVE` operations as
 * a single `ProductChange`. Mirrors the admin batch endpoint so the
 * vendor "add multiple attributes" wizard can submit once instead of
 * looping per-attribute and producing N separate change records.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchProductAttributesType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const { create, delete: toDelete } = req.validatedBody

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  const operations = [
    ...(create ?? []).map((c) => ({
      type: "add" as const,
      attribute_id: c.attribute_id,
      value_ids: "attribute_value_ids" in c ? c.attribute_value_ids : undefined,
      values: "values" in c ? c.values : undefined,
    })),
    ...(toDelete ?? []).map((attribute_id) => ({
      type: "remove" as const,
      attribute_id,
    })),
  ]

  const { result } = await productEditUpdateAttributesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations,
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
