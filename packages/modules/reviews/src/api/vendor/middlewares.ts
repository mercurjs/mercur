import { MiddlewareRoute } from "@medusajs/framework";
import { vendorSellersMiddlewares } from "./sellers/middlewares";

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorSellersMiddlewares,
];
