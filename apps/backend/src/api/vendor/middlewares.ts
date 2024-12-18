import { unlessBaseUrl } from '#/shared/infra/http/utils'

import { MiddlewareRoute, authenticate } from '@medusajs/framework'

import { vendorCors } from './cors'
import { vendorFulfillmentSetsMiddlewares } from './fulfillment-sets/middlewares'
import { vendorInventoryItemsMiddlewares } from './inventory-items/middlewares'
import { vendorInvitesMiddlewares } from './invites/middlewares'
import { vendorPayoutAccountMiddlewares } from './payout-account/middlewares'
import { vendorPayoutMiddlewares } from './payouts/middlewares'
import { vendorOrderMiddlewares } from './orders/middlewares'
import { vendorProductsMiddlewares } from './products/middlewares'
import { vendorSellersMiddlewares } from './sellers/middlewares'
import { vendorShippingOptionsMiddlewares } from './shipping-options/middlewares'
import { vendorStockLocationsMiddlewares } from './stock-locations/middlewares'

export const vendorMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/vendor*',
    middlewares: [vendorCors]
  },
  /**
   * @desc Here we are authenticating the seller routes
   * except for the route for creating a seller
   * and the route for accepting a member invite
   */
  {
    matcher: '/vendor/sellers',
    method: ['POST'],
    middlewares: [
      authenticate('seller', ['bearer', 'session'], {
        allowUnregistered: true
      })
    ]
  },
  {
    matcher: '/vendor/invites/accept',
    method: ['POST'],
    middlewares: [authenticate('seller', ['bearer', 'session'])]
  },
  {
    matcher: '/vendor/*',
    middlewares: [
      unlessBaseUrl(
        /^\/vendor\/(sellers|invites\/accept)$/,
        authenticate('seller', ['bearer', 'session'], {
          allowUnregistered: false
        })
      )
    ]
  },
  ...vendorSellersMiddlewares,
  ...vendorProductsMiddlewares,
  ...vendorInvitesMiddlewares,
  ...vendorFulfillmentSetsMiddlewares,
  ...vendorStockLocationsMiddlewares,
  ...vendorShippingOptionsMiddlewares,
  ...vendorPayoutAccountMiddlewares,
  ...vendorInventoryItemsMiddlewares,
  ...vendorPayoutMiddlewares,
  ...vendorOrderMiddlewares,
  ...vendorInventoryItemsMiddlewares
]
