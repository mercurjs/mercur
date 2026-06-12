import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import {
  createProductsWorkflow,
  type CreateProductWorkflowInput,
} from "../../../workflows/product/workflows/create-products"
import { enrichProductAttributes } from "../../utils"
import { wrapProductVariantsWithOffers } from "./helpers"
import { VendorCreateProductType, VendorGetProductsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetProductsParamsType>,
  res: MedusaResponse<HttpTypes.VendorProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Offers are a per-seller overlay on the shared Offer ↔ Variant link;
  // strip the requested `variants.offers.*` fields before the graph read
  // and re-attach the active seller's offers afterwards so a competitor's
  // offers on a master variant never leak (Medusa's strip-then-wrap flow).
  const withOffers = req.queryConfig.fields.some((field) =>
    field.includes("variants.offers")
  )
  if (withOffers) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.offers")
    )
  }

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  await enrichProductAttributes(req.scope, products as any[])

  if (withOffers) {
    await wrapProductVariantsWithOffers(
      req.scope,
      req.seller_context!.seller_id,
      products as Parameters<typeof wrapProductVariantsWithOffers>[2]
    )
  }

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

/**
 * Vendor product submission. The Mercur wrapper around stock
 * `createProductsWorkflow` records a single immediately-confirmed
 * `ProductChange` per created product with a `STATUS_CHANGE` action
 * pinned to the initial status — that's the audit trail for the
 * submission. The actual publish-approval lifecycle lives on
 * `/admin/products/:id/{confirm,reject,request-changes}`, which open
 * their own confirmed audit changes against the same product.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductType & AdditionalData>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const { additional_data, ...payload } = req.validatedBody

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          ...payload,
          status: payload.status ?? ProductStatus.PROPOSED,
        } as CreateProductWorkflowInput,
      ],
      seller_ids: [sellerId],
      additional_data,
    },
  })

  const createdId = (result as { id: string }[])[0].id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  await enrichProductAttributes(req.scope, [product])

  res.status(201).json({ product })
}
