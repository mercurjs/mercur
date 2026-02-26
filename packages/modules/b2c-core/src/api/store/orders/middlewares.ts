import {
  MiddlewareRoute,
  validateAndTransformQuery
} from '@medusajs/framework';
import { checkCustomerResourceOwnershipByResourceId } from '@mercurjs/framework';
import { retrieveTransformQueryConfig } from './query-config';
import { StoreGetOrdersOrderParams } from './validators';

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
  }
];
