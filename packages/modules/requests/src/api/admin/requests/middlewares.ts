import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework';
import { MiddlewareRoute } from '@medusajs/medusa';

import { applyRequestsCreatedAtFilter } from '../../middlewares/apply-request-created-at-filter';
import { applyRequestsSellerFilter } from '../../middlewares/apply-request-seller-filter';
import { applyRequestsStatusFilter } from '../../middlewares/apply-request-status-filter';
import { applyRequestsTypeFilter } from '../../middlewares/apply-request-type-filter';
import { adminRequestsConfig } from './query-config';
import { AdminGetRequestsParams, AdminReviewRequest } from './validators';

export const requestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/requests',
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestsConfig.list
      ),
      applyRequestsStatusFilter(),
      applyRequestsTypeFilter(),
      applyRequestsSellerFilter(),
      applyRequestsCreatedAtFilter()
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/requests/:id',
    middlewares: [validateAndTransformBody(AdminReviewRequest)]
  },
  {
    method: ['GET'],
    matcher: '/admin/requests/:id',
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestsConfig.retrieve
      )
    ]
  }
];
