import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"
import { VendorGetCollectionsParamsType } from "./validators"
import { wrapCollectionsWithProducts } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetCollectionsParamsType>,
  res: MedusaResponse<HttpTypes.VendorCollectionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const withProducts = req.queryConfig.fields.some((field) =>
    field.includes("products")
  )

  const { data: collections, metadata } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields.filter(field => !field.includes("products")),
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  if (withProducts) {
    await wrapCollectionsWithProducts(collections, req)
  }

  res.json({
    collections,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

