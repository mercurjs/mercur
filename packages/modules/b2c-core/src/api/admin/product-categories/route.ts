import { AuthenticatedMedusaRequest, MedusaResponse, refetchEntities } from "@medusajs/framework"
import { HttpTypes } from "@medusajs/framework/types"
import { defaultAdminCategoryDetailFields } from "./query-config"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductCategoryListParams>,
  res: MedusaResponse<HttpTypes.AdminProductCategoryListResponse>
) => {
  const { data: product_categories, metadata } = await refetchEntities({
    entity: "product_category",
    idOrFilter: req.filterableFields,
    scope: req.scope,
    fields: [
        ...req.queryConfig.fields,
        ...defaultAdminCategoryDetailFields.map(field => `category_detail.${field}`)
    ],
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_categories,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
