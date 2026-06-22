import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateVariantsWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-update-variants"
import { VendorUpdateProductVariantType } from "../../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [variant],
  } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { id: req.params.variant_id, product_id: req.params.id },
  })

  if (!variant) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant with id ${req.params.variant_id} was not found`
    )
  }

  res.json({ variant })
}

/**
 * Stages a `VARIANT_UPDATE` action. Auto-confirm runs
 * `updateProductVariantsWorkflow` inline when the flag is off.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductVariantType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  const { attribute_values: _av, ...update } = req.validatedBody

  // `manage_inventory` is a marketplace invariant pinned to `false` at
  // variant creation (see `create-products` / variant create route); it
  // is not vendor-editable, so we deliberately do NOT inject it here.
  // Forcing it in re-staged a phantom no-op change on every edit, which
  // polluted the request block (MER-168). The workflow diffs the rest of
  // the payload and stages only the fields that actually changed.
  const { result } = await productEditUpdateVariantsWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [
        {
          type: "update",
          variant_id: variantId,
          fields: update,
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
 * Stages a `VARIANT_REMOVE` action. Auto-confirm runs
 * `deleteProductVariantsWorkflow` inline when the flag is off.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  const { result } = await productEditUpdateVariantsWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [{ type: "remove", variant_id: variantId }],
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
