import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import { adminRequestsConfig } from "./query-config";
import { AdminGetRequestsParams, AdminReviewRequest } from "./validators";
import { applyRequestsStatusFilter } from "../../middlewares/apply-request-status-filter";
import { applyRequestsTypeFilter } from "../../middlewares/apply-request-type-filter";

export const requestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/requests",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestsConfig.list
      ),
      applyRequestsStatusFilter(),
      applyRequestsTypeFilter(),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/requests/:id",
    middlewares: [validateAndTransformBody(AdminReviewRequest)],
  },
  {
    method: ["GET"],
    matcher: "/admin/requests/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestsConfig.retrieve
      ),
    ],
  },
];
