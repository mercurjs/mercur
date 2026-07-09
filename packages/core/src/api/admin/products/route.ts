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
  listProducts,
  wrapProductVariantsWithOffers,
} from "../../utils"
import { AdminCreateProductType, AdminGetProductsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetProductsParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) => {
  const withOffers = req.queryConfig.fields.some((field) =>
    field.includes("variants.offers")
  )
  if (withOffers) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.offers")
    )
  }

  const { products, count, offset, limit } = await listProducts<
    HttpTypes.AdminProductListResponse["products"][number]
  >(req.scope, {
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

  res.json({ products, count, offset, limit })
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
      created_by: req.auth_context.actor_id,
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
