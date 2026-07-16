import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import {
  createProductsWorkflow,
  type CreateProductsWorkflowInput,
} from "../../../workflows/product/workflows/create-products"
import { resolveRequireProductApproval } from "../../../utils/require-product-approval"
import {
  enrichProductAttributes,
  wrapProductVariantsWithOffers,
} from "../../utils"
import { VendorCreateProductType, VendorGetProductsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetProductsParamsType>,
  res: MedusaResponse<HttpTypes.VendorProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

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
      products as Parameters<typeof wrapProductVariantsWithOffers>[1],
      req.seller_context!.seller_id
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
  req: AuthenticatedMedusaRequest<VendorCreateProductType & AdditionalData>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const { additional_data, ...payload } = req.validatedBody

  const requireApproval = await resolveRequireProductApproval(req.scope)

  if (
    payload.status !== undefined &&
    requireApproval &&
    payload.status !== ProductStatus.DRAFT &&
    payload.status !== ProductStatus.PROPOSED
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `When admin approval is required, product status must be one of: ${ProductStatus.DRAFT}, ${ProductStatus.PROPOSED}.`
    )
  }

  const productInput = {
    ...payload,
    status: payload.status ?? ProductStatus.PROPOSED,
  } as unknown as CreateProductsWorkflowInput["products"][number]

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [productInput],
      created_by: sellerId,
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
