import { MiddlewareRoute } from "@medusajs/framework";

import { attributeMiddlewares } from "./attributes/middlewares";
import { adminClaimInboundItemsMiddlewares } from "./claims/[id]/inbound/items/middlewares";
import { configurationMiddleware } from "./configuration/middlewares";
import { adminExchangeInboundItemsMiddlewares } from "./exchanges/[id]/inbound/items/middlewares";
import { orderSetsMiddlewares } from "./order-sets/middlewares";
import { adminProductsMiddlewares } from "./products/middlewares";
import { adminReturnRequestItemsMiddlewares } from "./returns/[id]/request-items/middlewares";
import { sellerMiddlewares } from "./sellers/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [
  ...orderSetsMiddlewares,
  ...configurationMiddleware,
  ...sellerMiddlewares,
  ...attributeMiddlewares,
  ...adminProductsMiddlewares,
  ...adminReturnRequestItemsMiddlewares,
  ...adminExchangeInboundItemsMiddlewares,
  ...adminClaimInboundItemsMiddlewares,
];
