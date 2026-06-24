import {
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { validateAndTransformQuery } from "@medusajs/framework"

import { storeProductQueryConfig } from "./query-config"
import {
  StoreGetProductParams,
  StoreGetProductsParams,
} from "./validators"
import { SellerStatus, ProductStatus } from "@mercurjs/types"

const applyProductFilters = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.status = ProductStatus.PUBLISHED
  next()
}

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
