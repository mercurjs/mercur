import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { filterBySellerId } from '../../../shared/infra/http/middlewares'
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
      validateAndTransformQuery(
        VendorGetMemberInviteParams,
        vendorMemberInviteQueryConfig.list
      ),
      filterBySellerId()
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
