import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { updateProductsWorkflow } from "../../../../workflows/product/workflows/update-products"
import {
  enrichProductAttributes,
  formatProductAttributes,
} from "../../../utils"
import { ensureSellerOwnsProduct } from "../helpers"
import { VendorUpdateProductType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

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

  formatProductAttributes(product)
  await enrichProductAttributes(req.scope, [product])

  res.json({ product })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductType & AdditionalData>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  await ensureSellerOwnsProduct(req.scope, sellerId, req.params.id)

  const { additional_data, ...update } = req.validatedBody

  await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: update as Record<string, unknown>,
      additional_data,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  formatProductAttributes(product)
  await enrichProductAttributes(req.scope, [product])

  res.json({ product })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  await ensureSellerOwnsProduct(req.scope, sellerId, req.params.id)

  await deleteProductsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product",
    deleted: true,
  })
}
