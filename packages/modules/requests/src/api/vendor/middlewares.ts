import { MiddlewareRoute } from "@medusajs/framework";
import { vendorRequestsMiddlewares } from "./requests/middlewares";

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorRequestsMiddlewares,
];
