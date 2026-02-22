import { MiddlewareRoute } from "@medusajs/framework";
import { vendorCommissionMiddlewares } from "./commission/middlewares";
import { vendorOrderCommissionMiddlewares } from "./orders/middlewares";

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorCommissionMiddlewares,
  ...vendorOrderCommissionMiddlewares,
];
