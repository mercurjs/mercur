import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { filterFieldSellerId } from '../../../shared/infra/http/middlewares'
import { vendorMemberInviteQueryConfig } from './query-config'
import {
  VendorAcceptMemberInvite,
  VendorGetMemberInviteParams,
  VendorInviteMember
} from './validators'

export const vendorInvitesMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/invites',
    middlewares: [
      filterFieldSellerId(),
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/invites',
    middlewares: [
      validateAndTransformBody(VendorInviteMember),
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/invites/accept',
    middlewares: [
      validateAndTransformBody(VendorAcceptMemberInvite),
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.retrieve
      )
    ]
  }
]
