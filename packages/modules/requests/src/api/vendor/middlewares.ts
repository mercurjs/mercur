import { MiddlewareRoute } from "@medusajs/framework";
import { vendorRequestsMiddlewares } from "./requests/middlewares";
import { vendorReturnRequestsMiddlewares } from "./return-request/middlewares";

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorRequestsMiddlewares,
  ...vendorReturnRequestsMiddlewares,
];
