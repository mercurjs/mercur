import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes, ProductChangeDTO } from "@mercurjs/types"

import { productEditDeleteProductWorkflow } from "../../../../workflows/product-edit/workflows/product-edit-delete-product"
import { productEditUpdateFieldsWorkflow } from "../../../../workflows/product-edit/workflows/product-edit-update-fields"
import {
  enrichProductAttributes,
  wrapProductVariantsWithOffers,
} from "../../../utils"
import { VendorUpdateProductType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Strip-then-wrap: the product-shaped offer detail requests
  // `variants.offers.*`; re-attach the active seller's offers after the
  // graph read so only the caller's offers surface (see
  // `wrapProductVariantsWithOffers`).
  const withOffers = req.queryConfig.fields.some((field) =>
    field.includes("variants.offers")
  )
  if (withOffers) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.offers")
    )
  }

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`
    )
  }

  await enrichProductAttributes(req.scope, [product])

  if (withOffers) {
    await wrapProductVariantsWithOffers(
      req.scope,
      [product] as Parameters<typeof wrapProductVariantsWithOffers>[1],
      req.seller_context!.seller_id
    )
  }

  res.json({ product })
}

/**
 * Stages a vendor product edit as a pending `ProductChange`. Each
 * changed field becomes a `ProductChangeAction` (`STATUS_CHANGE` for
 * status, `UPDATE { field, value }` otherwise). When the
 * `PRODUCT_REQUEST` feature flag is disabled the staged change is
 * confirmed inline and applied to the underlying product before the
 * response returns. Returns 202 with `{ product_change }` so the
 * vendor UI can show pending state regardless of flag.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductType & AdditionalData>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const { additional_data: _ad, ...update } = req.validatedBody

  const { result } = await productEditUpdateFieldsWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      created_by: sellerId,
      update: update as Record<string, unknown>,
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
 * Stages a vendor-initiated delete as a `PRODUCT_DELETE` action on a
 * fresh `ProductChange`. Auto-confirm applies it inline when the
 * `PRODUCT_REQUEST` feature flag is disabled.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const { result } = await productEditDeleteProductWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      created_by: sellerId,
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
