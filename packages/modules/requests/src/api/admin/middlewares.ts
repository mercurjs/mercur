import { MiddlewareRoute } from "@medusajs/framework";
import { requestsMiddlewares } from "./requests/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [...requestsMiddlewares];
