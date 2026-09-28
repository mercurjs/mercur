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

import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import {
  enrichProductAttributes,
  wrapProductVariantsWithOffers,
} from "../../../utils"
import { productEditDeleteProductWorkflow } from "../../../../workflows/product-edit/workflows/product-edit-delete-product"
import { AdminUpdateProductType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
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
      req.filterableFields?.seller_id as string | undefined
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
    },
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
  await productEditDeleteProductWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      created_by: req.auth_context.actor_id,
      auto_confirm: true,
    },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product",
    deleted: true,
  })
}
