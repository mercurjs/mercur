import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductsWorkflow } from "../../../workflows/product/workflows/create-products"
import {
  enrichProductAttributes,
  wrapProductVariantsWithOffers,
} from "../../utils"
import { AdminCreateProductType, AdminGetProductsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetProductsParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Offers overlay the shared Offer ↔ Variant link; strip the requested
  // `variants.offers.*` fields before the graph read and re-attach every
  // seller's offers afterwards so the admin (platform-wide) Offers list /
  // detail can render the per-variant offers + their Store.
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
      products as Parameters<typeof wrapProductVariantsWithOffers>[1]
    )
  }

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...productData } = req.validatedBody

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [{
        ...productData,
      }],
      additional_data,
    } as any,
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

  res.status(200).json({ product })
}
