import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@medusajs/types"

import { AdminCreateCollectionType } from "./validators"
import { createProductCollectionWithImagesWorkflow } from "../../../workflows/media/workflows/create-product-collection-with-images"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCollectionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: collections, metadata } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    collections,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCollectionType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    additional_data: _additional_data,
    media,
    icon,
    ...payload
  } = req.validatedBody

  const { result: createdId } =
    await createProductCollectionWithImagesWorkflow(req.scope).run({
      input: { collection: payload, media, icon },
    })

  const {
    data: [collection],
  } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  res.status(200).json({ collection })
}
