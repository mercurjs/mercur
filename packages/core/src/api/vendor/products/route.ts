import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import {
  HttpTypes,
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import { createProductsWorkflow } from "../../../workflows/product/workflows/create-products"
import { autoConfirmProductChangeWorkflow } from "../../../workflows/product-edit/workflows/auto-confirm-product-change"
import type ProductChangeModuleService from "../../../modules/product-change/service"
import { enrichProductAttributes } from "../../utils"
import { VendorCreateProductType, VendorGetProductsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetProductsParamsType>,
  res: MedusaResponse<HttpTypes.VendorProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  await enrichProductAttributes(req.scope, products as any[])

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
  const createdStatus = payload.status ?? ProductStatus.PROPOSED

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          ...payload,
          status: createdStatus,
        } as Record<string, unknown>,
      ],
      seller_ids: [sellerId],
      additional_data,
    },
  })

  const createdId = (result as { id: string }[])[0].id

  // Open the publish-approval `ProductChange` so the admin
  // confirm / reject / request-changes endpoints have something to
  // act on. Only `PROPOSED` products are awaiting publish — `DRAFT`
  // ones haven't been submitted yet, so they don't need a change.
  // The change carries a `STATUS_CHANGE` action that publishes the
  // product when the admin confirms it; `autoConfirmProductChangeWorkflow`
  // applies it inline when `MEDUSA_FF_PRODUCT_REQUEST` is disabled so
  // marketplaces without an approval queue still publish on create.
  if (createdStatus === ProductStatus.PROPOSED) {
    const service = req.scope.resolve<ProductChangeModuleService>(
      MercurModules.PRODUCT_CHANGE,
    )
    const [change] = await service.createProductChanges([
      {
        product_id: createdId,
        created_by: sellerId,
        status: ProductChangeStatus.PENDING,
      },
    ])
    await service.createProductChangeActions([
      {
        product_change_id: change.id,
        product_id: createdId,
        action: ProductChangeActionType.STATUS_CHANGE,
        details: {
          status: ProductStatus.PUBLISHED,
          previous_status: ProductStatus.PROPOSED,
        },
      },
    ])

    await autoConfirmProductChangeWorkflow(req.scope).run({
      input: { change_id: change.id, confirmed_by: sellerId },
    })
  }

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
