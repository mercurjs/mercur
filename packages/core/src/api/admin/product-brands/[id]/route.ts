import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"

import { deleteProductBrandsWorkflow } from "../../../../workflows/product/workflows/delete-product-brands"
import { updateProductBrandsWorkflow } from "../../../../workflows/product/workflows/update-product-brands"
import { AdminUpdateProductBrandType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_brand],
  } = await query.graph({
    entity: "product_brand",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product brand with id ${req.params.id} was not found`
    )
  }

  res.json({ product_brand })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductBrandType & AdditionalData>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...update } = req.validatedBody

  await updateProductBrandsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update,
    },
  })

  const {
    data: [product_brand],
  } = await query.graph({
    entity: "product_brand",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product brand with id ${req.params.id} was not found`
    )
  }

  res.json({ product_brand })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteProductBrandsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product_brand",
    deleted: true,
  })
}
