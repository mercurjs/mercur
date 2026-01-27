import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { authenticate, MiddlewareRoute } from "@medusajs/medusa";

import { isPresent, ProductStatus } from "@medusajs/framework/utils";
import { listProductQueryConfig } from "@medusajs/medusa/api/store/products/query-config";
import { StoreGetProductsParams } from "@medusajs/medusa/api/store/products/validators";
import { storeWishlistQueryConfig } from "./query-config";
import { StoreCreateWishlist, StoreGetWishlistsParams } from "./validators";

import {
  applyDefaultFilters,
  clearFiltersByKey,
  maybeApplyLinkFilter,
} from "@medusajs/framework/http";
import {
  filterByValidSalesChannels,
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index";

export const storeWishlistMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/wishlist",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformQuery(StoreGetProductsParams, listProductQueryConfig),
      filterByValidSalesChannels(),
      maybeApplyLinkFilter({
        entryPoint: "product_sales_channel",
        resourceId: "product_id",
        filterableField: "sales_channel_id",
      }),
      applyDefaultFilters({
        status: ProductStatus.PUBLISHED,
        // TODO: the type here seems off and the implementation does not take into account $and and $or possible filters. Might be worth re working (original type used here was StoreGetProductsParamsType)
        categories: (filters: any, _fields: string[]) => {
          const categoryIds = filters.category_id;
          delete filters.category_id;

          if (!isPresent(categoryIds)) {
            return;
          }

          return { id: categoryIds, is_internal: false, is_active: true };
        },
      }),
      normalizeDataForContext(),
      setPricingContext(),
      setTaxContext(),
      clearFiltersByKey(["region_id", "country_code", "province", "cart_id"]),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/wishlist",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformQuery(
        StoreGetWishlistsParams,
        storeWishlistQueryConfig.retrieve
      ),
      validateAndTransformBody(StoreCreateWishlist),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/wishlist/product/:reference_id",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
    ],
  },
];
