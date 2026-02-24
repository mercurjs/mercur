import { MiddlewareRoute } from "@medusajs/framework";
import { vendorReviewsMiddlewares } from "./reviews/middlewares";

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorReviewsMiddlewares,
];
