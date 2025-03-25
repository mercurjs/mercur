import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerCustomerGroup from '../../../links/seller-customer-group'
import { checkResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares'
import { vendorCustomerGroupsQueryConfig } from './query-config'
import {
  VendorCreateCustomerGroup,
  VendorGetCustomerGroupsParams,
  VendorLinkCustomersToGroup
} from './validators'

export const vendorCustomerGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/customer-groups',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupsQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/customer-groups',
    middlewares: [
      validateAndTransformBody(VendorCreateCustomerGroup),
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupsQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/customer-groups/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCustomerGroup.entryPoint,
        filterField: 'customer_group_id'
      }),
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupsQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/customer-groups/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCustomerGroup.entryPoint,
        filterField: 'customer_group_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/customer-groups/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCustomerGroup.entryPoint,
        filterField: 'customer_group_id'
      }),
      validateAndTransformBody(VendorCreateCustomerGroup),
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupsQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/customer-groups/:id/customers',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCustomerGroup.entryPoint,
        filterField: 'customer_group_id'
      }),
      validateAndTransformBody(VendorLinkCustomersToGroup),
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupsQueryConfig.retrieve
      )
    ]
  }
]
