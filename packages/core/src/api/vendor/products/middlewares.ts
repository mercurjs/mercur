import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
import { ProductStatus } from "@mercurjs/types"

import { applyOfferedProductsFilter } from "../../utils"
import {
  getProductIdsRestrictedFromSeller,
  getSellerOwnedProductIds,
} from "./helpers"
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
import { promiseAll } from "@medusajs/framework/utils"

const applySellerProductLinkFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sellerId = req.seller_context!.seller_id

  const [ownProductIds, restrictedFromSellerIds] = await promiseAll([
    getSellerOwnedProductIds(req.scope, sellerId),
    getProductIdsRestrictedFromSeller(req.scope, sellerId),
  ])

  req.filterableFields ??= {}
  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    {
      $or: [
        { id: ownProductIds },
        {
          status: ProductStatus.PUBLISHED,
          id: { $nin: restrictedFromSellerIds },
        },
      ],
    },
  ]

  return next()
}

export const vendorProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductsParams,
        vendorProductQueryConfig.list
      ),
      applySellerProductLinkFilter,
      applyOfferedProductsFilter,
    ],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformBody(VendorCreateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.create,
      },
    ],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.delete,
      },
    ],
  },

  {
    method: ["POST"],
    matcher: "/vendor/products/:id/cancel",
    middlewares: [validateAndTransformBody(VendorCancelProductChange)],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.update,
      },
    ],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantsParams,
        vendorProductVariantQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_variant,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants",
    middlewares: [
      validateAndTransformBody(VendorAddProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_variant,
        operation: PolicyOperation.update,
      },
    ],
  },

  {
    method: ["GET"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductVariantParams,
        vendorProductVariantQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_variant,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformBody(VendorUpdateProductVariant),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_variant,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id/variants/:variant_id",
    middlewares: [],
    policies: [
      {
        resource: PolicyResource.product_variant,
        operation: PolicyOperation.delete,
      },
    ],
  },

  {
    method: ["POST"],
    matcher: "/vendor/products/:id/attributes/batch",
    middlewares: [
      validateAndTransformBody(VendorBatchProductAttributes),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product,
        operation: PolicyOperation.update,
      },
    ],
  },
]
