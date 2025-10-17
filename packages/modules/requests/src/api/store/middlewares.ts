import { MiddlewareRoute } from "@medusajs/framework";
import { storeOrderReturnRequestsMiddlewares } from "./return-request/middlewares";

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeOrderReturnRequestsMiddlewares,
];
