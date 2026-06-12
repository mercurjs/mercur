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
  wrapProductVariantsWithOffers,
} from "../../../utils"
import { AdminUpdateProductType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Strip-then-wrap: the product-shaped offer detail requests
  // `variants.offers.*`; re-attach every seller's offers after the graph
  // read so the admin detail can render per-variant offers + their Store.
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
      [product] as Parameters<typeof wrapProductVariantsWithOffers>[1]
    )
  }

  res.json({ product })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...update } = req.validatedBody

  await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: update as Record<string, unknown>,
      additional_data,
    } as any,
  })

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

  res.json({ product })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductDeleteResponse>
) => {
  await deleteProductsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product",
    deleted: true,
  })
}
