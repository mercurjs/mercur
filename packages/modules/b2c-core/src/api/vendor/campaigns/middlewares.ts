import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import sellerCampaign from '../../../links/seller-campaign'
import { vendorCampaignQueryConfig } from './query-config'
import {
  VendorCreateCampaign,
  VendorGetCampaignsParams,
  VendorUpdateCampaign
} from './validators'

export const vendorCampaignsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/campaigns',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/campaigns/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCampaign.entryPoint,
        filterField: 'campaign_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/campaigns/:id',
    middlewares: [
      validateAndTransformBody(VendorUpdateCampaign),
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCampaign.entryPoint,
        filterField: 'campaign_id'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/campaigns/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCampaign.entryPoint,
        filterField: 'campaign_id'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/campaigns',
    middlewares: [
      validateAndTransformBody(VendorCreateCampaign),
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/campaigns/:id/promotions',
    middlewares: [
      validateAndTransformBody(VendorAssignCampaignPromotions),
      validateAndTransformQuery(
        VendorGetCampaignsParams,
        vendorCampaignQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerCampaign.entryPoint,
        filterField: 'campaign_id'
      }),
      checkResourceOwnershipByResourceId<VendorAssignCampaignPromotionsType>({
        entryPoint: sellerPromotion.entryPoint,
        filterField: 'promotion_id',
        resourceId: (req) => {
          const body = (req.validatedBody ?? req.body) as VendorAssignCampaignPromotionsType
          return [...(body?.add || []), ...(body?.remove || [])]
        }
      })
    ],
  },
]
