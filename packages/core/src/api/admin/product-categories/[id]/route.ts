import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { AdditionalData } from "@medusajs/framework/types"

import { deleteProductCategoriesWorkflow } from "../../../../workflows/product/workflows/delete-product-categories"
import { updateProductCategoriesWorkflow } from "../../../../workflows/product/workflows/update-product-categories"
import { AdminUpdateProductCategoryType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_category],
  } = await query.graph({
    entity: "product_category",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id ${req.params.id} was not found`
    )
  }

  res.json({ product_category })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductCategoryType & AdditionalData>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...update } = req.validatedBody

  await updateProductCategoriesWorkflow(req.scope).run({
    input: {
      categories: [{ id: req.params.id, ...update }],
    },
  })

  const {
    data: [product_category],
  } = await query.graph({
    entity: "product_category",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id ${req.params.id} was not found`
    )
  }

  res.json({ product_category })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteProductCategoriesWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product_category",
    deleted: true,
  })
}
