import { NextFunction } from 'express'

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import sellerInventoryItem from '../../../links/seller-inventory-item'
import sellerStockLocation from '../../../links/seller-stock-location'
import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { vendorReservationQueryConfig } from './query-config'
import {
  VendorCreateReservation,
  VendorCreateReservationType,
  VendorGetReservationParams,
  VendorUpdateReservation
} from './validators'

const checkReservationOwnership = () => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [reservation]
    } = await query.graph({
      entity: 'reservation',
      fields: ['inventory_item_id'],
      filters: {
        id: req.params.id
      }
    })

    if (!reservation) {
      res.status(404).json({
        message: `Entity not found`,
        type: MedusaError.Types.NOT_FOUND
      })
      return
    }

    const {
      data: [relation]
    } = await query.graph({
      entity: sellerInventoryItem.entryPoint,
      fields: ['seller_id'],
      filters: {
        inventory_item_id: reservation.inventory_item_id
      }
    })

    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope
    )

    if (!seller || !relation || seller.id !== relation.seller_id) {
      res.status(403).json({
        message: 'You are not allowed to perform this action',
        type: MedusaError.Types.NOT_ALLOWED
      })
      return
    }

    next()
  }
}

const canCreateReservation = () => {
  return async (
    req: AuthenticatedMedusaRequest<VendorCreateReservationType>,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const seller = await fetchSellerByAuthActorId(
      req.auth_context.actor_id,
      req.scope
    )

    const {
      data: [item]
    } = await query.graph({
      entity: sellerInventoryItem.entryPoint,
      fields: ['id'],
      filters: {
        inventory_item_id: req.validatedBody.inventory_item_id,
        seller_id: seller.id
      }
    })

    const {
      data: [location]
    } = await query.graph({
      entity: sellerStockLocation.entryPoint,
      fields: ['id'],
      filters: {
        stock_location_id: req.validatedBody.location_id,
        seller_id: seller.id
      }
    })

    if (!seller || !item || !location) {
      res.status(403).json({
        message: 'You are not allowed to perform this action',
        type: MedusaError.Types.NOT_ALLOWED
      })
      return
    }

    next()
  }
}

export const vendorReservationsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/reservations',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/reservations',
    middlewares: [
      validateAndTransformBody(VendorCreateReservation),
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
      canCreateReservation()
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/vendor/reservations/:id',
    middlewares: [checkReservationOwnership()]
  },
  {
    method: ['POST'],
    matcher: '/vendor/reservations/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateReservation),
      checkReservationOwnership()
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/reservations/:id',
    middlewares: [
      validateAndTransformQuery(
        VendorGetReservationParams,
        vendorReservationQueryConfig.retrieve
      ),
      checkReservationOwnership()
    ]
  }
]
