import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";

import {
  AdminCreateRule,
  AdminGetRulesParams,
  AdminUpdateRule,
} from "./validators";

export const configurationMiddleware: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/configuration",
    middlewares: [validateAndTransformQuery(AdminGetRulesParams, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/configuration",
    middlewares: [validateAndTransformBody(AdminCreateRule)],
  },
  {
    method: ["POST"],
    matcher: "/admin/configuration/:id",
    middlewares: [validateAndTransformBody(AdminUpdateRule)],
  },
];
