import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import customerWishlist from '../../../links/customer-wishlist'
import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares/check-customer-ownership'
import { storeWishlistQueryConfig } from './query-config'
import { StoreCreateWishlist, StoreGetWishlistsParams } from './validators'
import { StoreGetProductsParams } from '@medusajs/medusa/api/store/products/validators'
import { listProductQueryConfig } from '@medusajs/medusa/api/store/products/query-config'
import { isPresent, ProductStatus } from '@medusajs/framework/utils';
import {
  featureFlagRouter,
} from "@medusajs/framework"

import {
  filterByValidSalesChannels,
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from '@medusajs/medusa/api/utils/middlewares/index';
import {
  applyDefaultFilters,
  clearFiltersByKey,
  maybeApplyLinkFilter,
} from "@medusajs/framework/http"
import IndexEngineFeatureFlag from "@medusajs/medusa/loaders/feature-flags/index-engine"

export const storeWishlistMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/wishlist',
    middlewares: [
      validateAndTransformQuery(
        StoreGetProductsParams,
        listProductQueryConfig
      ),
      filterByValidSalesChannels(),
      (req, res, next) => {
        const canUseIndex = !(
          isPresent(req.filterableFields.tags) ||
          isPresent(req.filterableFields.categories)
        )
        if (
          featureFlagRouter.isFeatureEnabled(IndexEngineFeatureFlag.key) &&
          canUseIndex
        ) {
          return next()
        }

        return maybeApplyLinkFilter({
          entryPoint: "product_sales_channel",
          resourceId: "product_id",
          filterableField: "sales_channel_id",
        })(req, res, next)
      },
      applyDefaultFilters({
        status: ProductStatus.PUBLISHED,
        // TODO: the type here seems off and the implementation does not take into account $and and $or possible filters. Might be worth re working (original type used here was StoreGetProductsParamsType)
        categories: (filters: any, fields: string[]) => {
          const categoryIds = filters.category_id
          delete filters.category_id

          if (!isPresent(categoryIds)) {
            return
          }

          return { id: categoryIds, is_internal: false, is_active: true }
        },
      }),
      normalizeDataForContext(),
      setPricingContext(),
      setTaxContext(),
      clearFiltersByKey(["region_id", "country_code", "province", "cart_id"]),
    ],
  },
  {
    method: ['POST'],
    matcher: '/store/wishlist',
    middlewares: [
      validateAndTransformQuery(
        StoreGetWishlistsParams,
        storeWishlistQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateWishlist)
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/wishlist/:id/product/:reference_id',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: customerWishlist.entryPoint,
        filterField: 'wishlist_id'
      })
    ]
  }
]
