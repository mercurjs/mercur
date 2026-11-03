import { requirePermission } from "../../utils"
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
import { applyOfferedProductsFilter } from "../../utils"
import { isProductVisibleToSeller } from "./helpers"
import {
  vendorProductQueryConfig,
  vendorProductVariantQueryConfig,
} from "./query-config"
import {
  VendorAddProductVariant,
  VendorBatchProductAttributes,
  VendorCancelProductChange,
  VendorCreateProduct,
  VendorGetProductParams,
  VendorGetProductsParams,
  VendorGetProductVariantParams,
  VendorGetProductVariantsParams,
  VendorUpdateProduct,
  VendorUpdateProductVariant,
} from "./validators"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

const ensureProductVisibleToSeller = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const productId = req.params.id
  const visible = await isProductVisibleToSeller(
    req.scope,
    req.seller_context!.seller_id,
    productId
  )

  if (!visible) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${productId} was not found`
      )
    )
  }

  return next()
}

const ensureVariantBelongsToProduct = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [variant],
  } = await query.graph({
    entity: "variant",
    fields: ["id"],
    filters: { id: req.params.variant_id, product_id: req.params.id },
  })

  if (!variant) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant with id ${req.params.variant_id} was not found`
    )
  }

  return next()
}

export const vendorProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/products/:id/preview",
    middlewares: [
      requirePermission("products", "view"),
      ensureProductVisibleToSeller,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/products",
    middlewares: [
      requirePermission("products", "view"),
      validateAndTransformQuery(
        VendorGetProductsParams,
        vendorProductQueryConfig.list
      ),
      applyOfferedProductsFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products",
    middlewares: [
      requirePermission("products", "edit"),
      validateAndTransformBody(VendorCreateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id",
    middlewares: [
      requirePermission("products", "view"),
      ensureProductVisibleToSeller,
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id",
    middlewares: [
      requirePermission("products", "edit"),
      ensureProductVisibleToSeller,
      validateAndTransformBody(VendorUpdateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id",
    middlewares: [
      requirePermission("products", "manage"),
      ensureProductVisibleToSeller,
    ],
  },

  {
    method: ["POST"],
    matcher: "/vendor/products/:id/cancel",
    middlewares: [
      requirePermission("products", "edit"),
      ensureProductVisibleToSeller,
      validateAndTransformBody(VendorCancelProductChange)],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      requirePermission("products", "view"),
      ensureProductVisibleToSeller,
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductVariantQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      requirePermission("products", "edit"),
      ensureProductVisibleToSeller,
      validateAndTransformBody(VendorAddProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      requirePermission("products", "view"),
      ensureProductVisibleToSeller,
      validateAndTransformQuery(
        VendorGetProductVariantParams,
        vendorProductVariantQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      requirePermission("products", "edit"),
      ensureProductVisibleToSeller,
      ensureVariantBelongsToProduct,
      validateAndTransformBody(VendorUpdateProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      requirePermission("products", "manage"),
      ensureProductVisibleToSeller,
      ensureVariantBelongsToProduct],
  },

  {
    method: ["POST"],
    matcher: "/vendor/products/:id/attributes/batch",
    middlewares: [
      requirePermission("products", "edit"),
      ensureProductVisibleToSeller,
      validateAndTransformBody(VendorBatchProductAttributes),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
]
