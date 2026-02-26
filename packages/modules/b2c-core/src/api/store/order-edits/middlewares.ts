import {
  authenticate,
  AuthenticatedMedusaRequest,
  MiddlewareRoute,
  validateAndTransformBody
} from '@medusajs/framework';
import {
  StorePostOrderEditsReqSchema,
  StorePostOrderEditsReqSchemaType
} from './validators';
import { checkCustomerResourceOwnershipByResourceId } from '@mercurjs/framework/dist/utils/middlewares/check-customer-ownership';

export const storeOrderEditsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/order-edits/*',
    middlewares: [authenticate('customer', ['bearer', 'session'])]
  },
  {
    method: ['POST'],
    matcher: '/store/order-edits',
    middlewares: [
      validateAndTransformBody(StorePostOrderEditsReqSchema),
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order',
        resourceId: (
          req: AuthenticatedMedusaRequest<StorePostOrderEditsReqSchemaType>
        ) => {
          return req.validatedBody.order_id;
        }
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/order-edits/:id',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order'
      })
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/order-edits/:id/item/:item_id',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/order-edits/:id/confirm',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order'
      })
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/order-edits/:id/request',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order'
      })
    ]
  }
];
