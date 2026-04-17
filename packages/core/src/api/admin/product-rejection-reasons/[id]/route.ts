import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { AdditionalData } from "@medusajs/framework/types"

import { deleteProductRejectionReasonsWorkflow } from "../../../../workflows/product/workflows/delete-product-rejection-reasons"
import { updateProductRejectionReasonsWorkflow } from "../../../../workflows/product/workflows/update-product-rejection-reasons"
import { AdminUpdateProductRejectionReasonType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product_rejection_reason],
  } = await query.graph({
    entity: "product_rejection_reason",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_rejection_reason) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product rejection reason with id ${req.params.id} was not found`
    )
  }

  res.json({ product_rejection_reason })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateProductRejectionReasonType & AdditionalData>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...update } = req.validatedBody

  await updateProductRejectionReasonsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update,
    },
  })

  const {
    data: [product_rejection_reason],
  } = await query.graph({
    entity: "product_rejection_reason",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product_rejection_reason) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product rejection reason with id ${req.params.id} was not found`
    )
  }

  res.json({ product_rejection_reason })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteProductRejectionReasonsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product_rejection_reason",
    deleted: true,
  })
}
