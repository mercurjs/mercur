import {
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { validateAndTransformQuery } from "@medusajs/framework"

import {
  StoreGetProductParams,
  StoreGetProductsParams,
} from "./validators"
import { SellerStatus, ProductStatus } from "@mercurjs/types"

const storeProductFields = [
  "id",
  "title",
  "subtitle",
  "status",
  "external_id",
  "description",
  "handle",
  "is_giftcard",
  "discountable",
  "thumbnail",
  "collection_id",
  "type_id",
  "brand_id",
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",
  "created_at",
  "updated_at",
  "metadata",
  "*type",
  "*brand",
  "*collection",
  "*tags",
  "*images",
  "*categories",
  "*variants",
  "*variants.attribute_values",
  "*variants.attribute_values.attribute",
  "*variants.offers",
  "*variant_attributes",
  "*variant_attributes.values",
  "*custom_attributes",
  "*custom_attributes.values",
  "*attribute_values",
  "*attribute_values.attribute",
]

const storeProductQueryConfig = {
  list: {
    defaults: storeProductFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductFields,
    isList: false,
  },
}

const applyProductFilters = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.status = ProductStatus.PUBLISHED
  next()
}

/**
 * Resolve sellers that are currently OPEN and not within an active
 * closure window, then expose their IDs as `seller_id` so the link
 * filter below can translate it into a product-id constraint via the
 * `product_seller` join entity.
 */
async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()

  const { data: visibleSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: {
      status: SellerStatus.OPEN,
      $and: [
        { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
        { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] },
      ],
    },
  })

  req.filterableFields ??= {}
  req.filterableFields.seller_id = visibleSellers.map(
    (s: { id: string }) => s.id
  )

  next()
}

export const storeProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/products",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductsParams,
        storeProductQueryConfig.list
      ),
      applyProductFilters,
      applyVisibleSellerIdsFilter,
      maybeApplyLinkFilter({
        entryPoint: "product_seller",
        resourceId: "product_id",
        filterableField: "seller_id",
      }),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/products/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductParams,
        storeProductQueryConfig.retrieve
      ),
      applyProductFilters,
      applyVisibleSellerIdsFilter,
      maybeApplyLinkFilter({
        entryPoint: "product_seller",
        resourceId: "product_id",
        filterableField: "seller_id",
      }),
    ],
  },
]
