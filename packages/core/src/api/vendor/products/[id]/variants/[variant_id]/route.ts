import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, UpdateProductVariantDTO } from "@mercurjs/types"

import { productEditRemoveVariantWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-remove-variant"
import { productEditUpdateVariantWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-update-variant"
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
      `Variant with id ${req.params.variant_id} was not found on product ${req.params.id}`
    )
  }

  res.json({ variant })
}

/**
 * Stages a `VARIANT_UPDATE` action via `product-edit-update-variant`.
 * Returns the created `ProductChange` — the variant is updated only after
 * an operator confirms the change.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductVariantType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id

  const { result: change } = await productEditUpdateVariantWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      variant_id: req.params.variant_id,
      fields: req.validatedBody as UpdateProductVariantDTO,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}

/**
 * Stages a `VARIANT_REMOVE` action via `product-edit-remove-variant`.
 * Returns the created `ProductChange` — the variant is deleted only after
 * an operator confirms the change.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id

  const { result: change } = await productEditRemoveVariantWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      variant_id: req.params.variant_id,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}
