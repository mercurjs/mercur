import { MiddlewareRoute } from "@medusajs/framework";

import { commissionMiddlewares } from "./commission/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [...commissionMiddlewares];
