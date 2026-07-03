import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { AdminCreateProductVariantType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductVariantListResponse>
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
  req: AuthenticatedMedusaRequest<
    AdminCreateProductVariantType & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const { additional_data, ...rest } = req.validatedBody

  await createProductVariantsWorkflow(req.scope).run({
    input: {
      product_variants: [
        {
          ...rest,
          sku: rest.sku ?? undefined,
          ean: rest.ean ?? undefined,
          upc: rest.upc ?? undefined,
          barcode: rest.barcode ?? undefined,
          hs_code: rest.hs_code ?? undefined,
          mid_code: rest.mid_code ?? undefined,
          material: rest.material ?? undefined,
          length: rest.length ?? undefined,
          height: rest.height ?? undefined,
          width: rest.width ?? undefined,
          weight: rest.weight ?? undefined,
          origin_country: rest.origin_country ?? undefined,
          metadata: rest.metadata ?? undefined,
          product_id: productId,
        },
      ],
      additional_data,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.status(200).json({ product })
}
