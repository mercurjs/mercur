import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework';
import { checkCustomerResourceOwnershipByResourceId } from '@mercurjs/framework';
import { retrieveTransformQueryConfig } from './query-config';
import {
  StoreCancelOrderItemsSchema,
  StoreGetOrdersOrderParams
} from './validators';

export const storeOrderMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/store/orders/:id/cancel',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order'
      }),
      validateAndTransformQuery(
        StoreGetOrdersOrderParams,
        retrieveTransformQueryConfig
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/orders/:id/items/cancel',
    middlewares: [
      authenticate('customer', ['bearer', 'session']),
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order'
      }),
      validateAndTransformBody(StoreCancelOrderItemsSchema)
    ]
  }
];
