import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import {
  adminComissionRateQueryConfig,
  adminComissionRuleQueryConfig
} from './query-config'
import {
  AdminComissionRateParams,
  AdminComissionRuleParams,
  AdminCreateComissionRate,
  AdminCreateComissionRule,
  AdminUpdateComissionRate,
  AdminUpdateComissionRule
} from './validators'

export const comissionMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/comission/rules',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRuleParams,
        adminComissionRuleQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/comission/rules',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRuleParams,
        adminComissionRuleQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminCreateComissionRule)
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/comission/rules/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRuleParams,
        adminComissionRuleQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/comission/rules/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRuleParams,
        adminComissionRuleQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminUpdateComissionRule)
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/comission/rates',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRateParams,
        adminComissionRateQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/comission/rates',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRateParams,
        adminComissionRateQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminCreateComissionRate)
    ]
  },
  {
    method: ['GET'],
    matcher: '/admin/comission/rates/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRateParams,
        adminComissionRateQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/comission/rates/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminComissionRateParams,
        adminComissionRateQueryConfig.retrieve
      ),
      validateAndTransformBody(AdminUpdateComissionRate)
    ]
  }
]
