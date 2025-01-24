import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import {
  adminCommissionRateQueryConfig,
  adminCommissionRuleQueryConfig
} from './query-config'
import {
  AdminCommissionRateParams,
  AdminCommissionRuleParams,
  AdminCreateCommissionRate,
  AdminCreateCommissionRule,
  AdminUpdateCommissionRate,
  AdminUpdateCommissionRule
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
    method: ['GET'],
    matcher: '/admin/commission/rules/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRuleParams,
        adminCommissionRuleQueryConfig.retrieve
      )
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
    method: ['GET'],
    matcher: '/admin/commission/rates',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRateParams,
        adminCommissionRateQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/commission/rates',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminCreateCommissionRate)
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/commission/rates/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/commission/rates/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminCommissionRateParams,
        adminCommissionRateQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminUpdateCommissionRate)
    ]
  }
]
