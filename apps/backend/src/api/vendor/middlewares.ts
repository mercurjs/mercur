import { MiddlewareRoute, authenticate } from '@medusajs/framework'

import {
  checkSellerApproved,
  storeActiveGuard
} from '../../shared/infra/http/middlewares'
import { unlessBaseUrl } from '../../shared/infra/http/utils'
import { vendorAttributeMiddlewares } from './attributes/middlewares'
import { vendorCampaignsMiddlewares } from './campaigns/middlewares'
import { vendorCommissionMiddlewares } from './commission/middlewares'
import { vendorCors } from './cors'
import { vendorCustomerGroupsMiddlewares } from './customer-groups/middlewares'
import { vendorCustomersMiddlewares } from './customers/middlewares'
import { vendorFulfillmentProvidersMiddlewares } from './fulfillment-providers/middlewares'
import { vendorFulfillmentSetsMiddlewares } from './fulfillment-sets/middlewares'
import { vendorInventoryItemsMiddlewares } from './inventory-items/middlewares'
import { vendorInvitesMiddlewares } from './invites/middlewares'
import { vendorMeMiddlewares } from './me/middlewares'
import { vendorMembersMiddlewares } from './members/middlewares'
import { vendorNotificationMiddlewares } from './notifications/middlewares'
import { vendorOrderMiddlewares } from './orders/middlewares'
import { vendorPayoutAccountMiddlewares } from './payout-account/middlewares'
import { vendorPayoutMiddlewares } from './payouts/middlewares'
import { vendorPriceListsMiddlewares } from './price-lists/middlewares'
import { vendorProductCategoriesMiddlewares } from './product-categories/middlewares'
import { vendorProductCollectionsMiddlewares } from './product-collections/middlewares'
import { vendorProductTagsMiddlewares } from './product-tags/middlewares'
import { vendorProductTypesMiddlewares } from './product-types/middlewares'
import { vendorProductsMiddlewares } from './products/middlewares'
import { vendorPromotionsMiddlewares } from './promotions/middlewares'
import { vendorRegionsMiddlewares } from './regions/middlewares'
import { vendorRequestsMiddlewares } from './requests/middlewares'
import { vendorReservationsMiddlewares } from './reservations/middlewares'
import { vendorReturnRequestsMiddlewares } from './return-request/middlewares'
import { vendorReturnsMiddlewares } from './returns/middlewares'
import { vendorSalesChannelMiddlewares } from './sales-channels/middlewares'
import { vendorSellersMiddlewares } from './sellers/middlewares'
import { vendorShippingOptionsMiddlewares } from './shipping-options/middlewares'
import { vendorShippingProfilesMiddlewares } from './shipping-profiles/middlewares'
import { vendorStatisticsMiddlewares } from './statistics/middlewares'
import { vendorStockLocationsMiddlewares } from './stock-locations/middlewares'
import { vendorStoresMiddlewares } from './stores/middlewares'
import { vendorUploadMiddlewares } from './uploads/middlewares'

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
        checkSellerApproved(['bearer', 'session'])
      ),
      unlessBaseUrl(
        /^\/vendor\/(sellers|invites\/accept)$/,
        authenticate('seller', ['bearer', 'session'], {
          allowUnregistered: false
        })
      ),
      unlessBaseUrl(
        /^\/vendor\/(sellers|orders|fulfillment|invites\/accept)/,
        storeActiveGuard
      )
    ]
  },
  ...vendorMeMiddlewares,
  ...vendorSellersMiddlewares,
  ...vendorMembersMiddlewares,
  ...vendorProductsMiddlewares,
  ...vendorInvitesMiddlewares,
  ...vendorFulfillmentSetsMiddlewares,
  ...vendorStockLocationsMiddlewares,
  ...vendorShippingOptionsMiddlewares,
  ...vendorPayoutAccountMiddlewares,
  ...vendorInventoryItemsMiddlewares,
  ...vendorPayoutMiddlewares,
  ...vendorOrderMiddlewares,
  ...vendorReturnRequestsMiddlewares,
  ...vendorInventoryItemsMiddlewares,
  ...vendorRequestsMiddlewares,
  ...vendorSalesChannelMiddlewares,
  ...vendorCustomersMiddlewares,
  ...vendorCustomerGroupsMiddlewares,
  ...vendorStoresMiddlewares,
  ...vendorProductTagsMiddlewares,
  ...vendorProductTypesMiddlewares,
  ...vendorProductCategoriesMiddlewares,
  ...vendorProductCollectionsMiddlewares,
  ...vendorUploadMiddlewares,
  ...vendorPromotionsMiddlewares,
  ...vendorReservationsMiddlewares,
  ...vendorPriceListsMiddlewares,
  ...vendorPromotionsMiddlewares,
  ...vendorCampaignsMiddlewares,
  ...vendorStatisticsMiddlewares,
  ...vendorFulfillmentProvidersMiddlewares,
  ...vendorReturnsMiddlewares,
  ...vendorShippingProfilesMiddlewares,
  ...vendorRegionsMiddlewares,
  ...vendorNotificationMiddlewares,
  ...vendorCommissionMiddlewares,
  ...vendorAttributeMiddlewares
]
