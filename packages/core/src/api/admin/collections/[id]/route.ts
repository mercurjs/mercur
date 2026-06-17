import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@medusajs/types"

import { AdminUpdateCollectionType } from "../validators"
import { updateProductCollectionWithImagesWorkflow } from "../../../../workflows/media/workflows/update-product-collection-with-images"
import { deleteProductCollectionWithImagesWorkflow } from "../../../../workflows/media/workflows/delete-product-collection-with-images"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [collection],
  } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!collection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Collection with id ${req.params.id} was not found`
    )
  }

  res.json({ collection })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateCollectionType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    additional_data: _additional_data,
    media,
    icon,
    ...update
  } = req.validatedBody

  await updateProductCollectionWithImagesWorkflow(req.scope).run({
    input: { id: req.params.id, update, media, icon },
  })

  const {
    data: [collection],
  } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!collection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Collection with id ${req.params.id} was not found`
    )
  }

  res.json({ collection })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCollectionDeleteResponse>
) => {
  await deleteProductCollectionWithImagesWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.status(200).json({
    id: req.params.id,
    object: "collection",
    deleted: true,
  })
}
