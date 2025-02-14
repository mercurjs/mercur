import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import { adminCommissionRuleQueryConfig } from "./query-config";
import {
  AdminCommissionRuleParams,
  AdminUpsertDefaultCommissionRule,
  AdminUpdateCommissionRule,
  AdminCreateCommissionRule,
} from "./validators";

export const commissionMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/commission/rules",
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.list,
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission/rules",
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.retrieve,
      ),
      validateAndTransformBody(AdminCreateCommissionRule),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission/rules/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.retrieve,
      ),
      validateAndTransformBody(AdminUpdateCommissionRule),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/commission/default",
    middlewares: [validateAndTransformBody(AdminUpsertDefaultCommissionRule)],
  },
];
