import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { ensureSellerOwnsProduct } from "../../helpers"
import { VendorAddProductVariantType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { data: variants, metadata } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, product_id: productId },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    variants,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductVariantType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  const { attribute_values: _av, ...rest } = req.validatedBody

  await createProductVariantsWorkflow(req.scope).run({
    input: {
      product_variants: [
        {
          ...(rest as Record<string, unknown>),
          product_id: productId,
          manage_inventory: false,
        } as any,
      ],
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
