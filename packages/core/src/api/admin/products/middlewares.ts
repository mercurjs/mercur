import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  adminProductQueryConfig,
  adminProductVariantQueryConfig,
} from "./query-config"
import {
  adminProductAttributeQueryConfig,
} from "../product-attributes/query-config"
import {
  AdminGetProductAttributeParams,
  AdminGetProductAttributesParams,
  AdminUpdateProductAttribute,
} from "../product-attributes/validators"
import {
  AdminAddProductAttribute,
  AdminBatchProductAttributes,
  AdminBatchProducts,
  AdminCreateProduct,
  AdminCreateProductVariant,
  AdminGetProductParams,
  AdminGetProductsParams,
  AdminGetProductVariantParams,
  AdminGetProductVariantsParams,
  AdminConfirmProduct,
  AdminRejectProduct,
  AdminRequestProductChanges,
  AdminUpdateProduct,
  AdminUpdateProductVariant,
} from "./validators"

/**
 * Scopes the product list to products carrying at least one offer, when
 * `?has_offer=true`. The admin Offers surface is product-grained but
 * platform-wide, so (unlike the seller-scoped vendor variant) offered
 * variant ids are resolved across **all** sellers by default. When a
 * `seller_id` is also present on the Offers list it is reinterpreted as
 * the offer's **store** (not product ownership) and consumed here, so the
 * scope becomes "products this store has an offer on". Both pseudo-filters
 * are removed before the product graph read.
 */
const applyOfferedProductsFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields ??= {}
  const hasOffer = req.filterableFields.has_offer
  delete req.filterableFields.has_offer

  if (hasOffer !== true) {
    return next()
  }

  // On the Offers surface, `seller_id` scopes the offer's store rather
  // than product ownership — pull it off the product filters and apply it
  // to the offer lookup instead.
  const storeId = req.filterableFields.seller_id as
    | string
    | string[]
    | undefined
  delete req.filterableFields.seller_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["variant_id"],
    filters: storeId ? { seller_id: storeId } : {},
  })

  const variantIds = Array.from(
    new Set(
      offers
        .map((offer: { variant_id: string | null }) => offer.variant_id)
        .filter((id: string | null): id is string => Boolean(id))
    )
  )

  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    // No offers → match nothing (empty list) rather than the whole catalogue.
    { variants: { id: variantIds.length ? variantIds : ["__none__"] } },
  ]

  return next()
}

export const adminProductsMiddlewares: MiddlewareRoute[] = [
  // --- CRUD ---
  {
    method: ["GET"],
    matcher: "/admin/products",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductsParams,
        adminProductQueryConfig.list
      ),
      applyOfferedProductsFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products",
    middlewares: [
      validateAndTransformBody(AdminCreateProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/batch",
    middlewares: [
      validateAndTransformBody(AdminBatchProducts),
      validateAndTransformQuery(
        AdminGetProductsParams,
        adminProductQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/confirm",
    middlewares: [
      validateAndTransformBody(AdminConfirmProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/request-changes",
    middlewares: [
      validateAndTransformBody(AdminRequestProductChanges),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/reject",
    middlewares: [
      validateAndTransformBody(AdminRejectProduct),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  // --- Variant sub-resource ---
  {
    method: ["GET"],
    matcher: "/admin/products/:id/variants",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductVariantsParams,
        adminProductVariantQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/variants",
    middlewares: [
      validateAndTransformBody(AdminCreateProductVariant),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductVariantParams,
        adminProductVariantQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductVariant),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },

  // --- Attribute sub-resource ---
  //
  // POST endpoints return the parent product, so they use the product
  // retrieve query config. GET list returns product attributes, so it
  // uses the attribute list config.
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes/batch",
    middlewares: [
      validateAndTransformBody(AdminBatchProductAttributes),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/attributes",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributesParams,
        adminProductAttributeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes",
    middlewares: [
      validateAndTransformBody(AdminAddProductAttribute),
      validateAndTransformQuery(
        AdminGetProductParams,
        adminProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/products/:id/attributes/:attribute_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/products/:id/attributes/:attribute_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductAttribute),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/products/:id/attributes/:attribute_id",
    middlewares: [],
  },
]
