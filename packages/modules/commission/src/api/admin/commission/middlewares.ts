import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import {
  adminCommissionLinesQueryConfig,
  adminCommissionRuleQueryConfig
} from './query-config'
import {
  AdminCommissionRuleParams,
  AdminCreateCommissionRule,
  AdminGetCommissionLinesParams,
  AdminUpdateCommissionRule,
  AdminUpsertDefaultCommissionRule
} from './validators'

export const commissionMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/commission/rules',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.list
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/commission/commission-lines',
    middlewares: [
      validateAndTransformQuery(
        AdminGetCommissionLinesParams,
        adminCommissionLinesQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/commission/rules',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminCreateCommissionRule)
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/commission/rules/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminUpdateCommissionRule)
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/commission/default',
    middlewares: [validateAndTransformBody(AdminUpsertDefaultCommissionRule)]
  }
]
