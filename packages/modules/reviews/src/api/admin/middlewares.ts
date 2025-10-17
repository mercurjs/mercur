import { MiddlewareRoute } from "@medusajs/framework";
import { reviewsMiddlewares } from "./reviews/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [...reviewsMiddlewares];
