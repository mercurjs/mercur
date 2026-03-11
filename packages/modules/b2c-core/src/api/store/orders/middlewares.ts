import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody
} from '@medusajs/framework';
import { checkCustomerResourceOwnershipByResourceId } from '@mercurjs/framework';
import {
  StoreCancelOrderItemsSchema
} from './validators';

export const storeOrderMiddlewares: MiddlewareRoute[] = [
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
