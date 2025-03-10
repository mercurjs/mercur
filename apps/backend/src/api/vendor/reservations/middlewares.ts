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
import { filterBySellerId } from '../../../shared/infra/http/middlewares'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { vendorReservationQueryConfig } from './query-config'
import {
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
