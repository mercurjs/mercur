import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { vendorMemberQueryConfig } from './query-config'
import { VendorGetMemberParams, VendorUpdateMember } from './validators'

export const vendorMembersMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/members',
    middlewares: [
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/members/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: 'member'
      }),
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/members/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: 'member'
      }),
      validateAndTransformBody(VendorUpdateMember),
      validateAndTransformQuery(
        VendorGetMemberParams,
        vendorMemberQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/members/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: 'member'
      })
    ]
  }
]
