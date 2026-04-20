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

import { deleteProductAttributesWorkflow } from "../../../../workflows/product/workflows/delete-product-attributes"
import { updateProductAttributesWorkflow } from "../../../../workflows/product/workflows/update-product-attributes"
import { AdminUpdateProductAttributeType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product attribute with id ${req.params.id} was not found`
    )
  }

  res.json({ product_attribute })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductAttributeType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...update } = req.validatedBody

  await updateProductAttributesWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: update,
    },
  })

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product attribute with id ${req.params.id} was not found`
    )
  }

  res.json({ product_attribute })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductAttributeDeleteResponse>
) => {
  await deleteProductAttributesWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product_attribute",
    deleted: true,
  })
}
