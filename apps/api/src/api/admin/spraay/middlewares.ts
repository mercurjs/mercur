import { validateAndTransformBody, validateAndTransformQuery } from '@medusajs/framework';
import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse, MiddlewareRoute } from '@medusajs/framework/http';
import { REQUIRED_PERMISSION, requirePermission } from '@mercurjs/core/api/utils/permissions-middleware';
import { MISSING_PERMISSION_CODE } from '@mercurjs/types';

import { SPRAAY_SIGN_PERMISSION } from '../../../modules/spraay-batch/permissions';
import { AdminGetSpraayBatchesParams, AdminSignSpraayBatch } from './validators';

/**
 * Core's `requirePermission` lets every request through when no permissions
 * module is configured. Broadcasting treasury funds must not work that way, so
 * this guard refuses unless permissions are actually being enforced.
 */
export function requireTreasurySigner() {
    const check = requirePermission(SPRAAY_SIGN_PERMISSION, 'edit');

    const middleware = (req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
        if (!req.permissions_enforced) {
            res.status(403).json({
                type: 'not_allowed',
                code: MISSING_PERMISSION_CODE,
                message: `Signing Spraay batches requires the ${SPRAAY_SIGN_PERMISSION}:edit permission. Configure a permissions module that grants it to treasury operators.`,
                permission: SPRAAY_SIGN_PERMISSION,
                right: 'edit',
            });
            return;
        }
        return check(req, res, next);
    };

    return Object.assign(middleware, { [REQUIRED_PERMISSION]: check[REQUIRED_PERMISSION] });
}

export const adminSpraayMiddlewares: MiddlewareRoute[] = [
    {
        method: ['GET'],
        matcher: '/admin/spraay/batches',
        middlewares: [
            requirePermission('payouts', 'view'),
            validateAndTransformQuery(AdminGetSpraayBatchesParams, { isList: true, defaults: [] }),
        ],
    },
    {
        method: ['GET'],
        matcher: '/admin/spraay/batches/:batchId',
        middlewares: [requirePermission('payouts', 'view')],
    },
    {
        method: ['GET'],
        matcher: '/admin/spraay/preflight',
        middlewares: [requirePermission('payouts', 'view')],
    },
    {
        method: ['POST'],
        matcher: '/admin/spraay/batches/:batchId/prepare',
        middlewares: [requirePermission('payouts', 'edit')],
    },
    {
        method: ['POST'],
        matcher: '/admin/spraay/batches/:batchId/sign',
        middlewares: [requireTreasurySigner(), validateAndTransformBody(AdminSignSpraayBatch)],
    },
    {
        method: ['POST'],
        matcher: '/admin/spraay/batches/:batchId/cancel',
        middlewares: [requirePermission('payouts', 'edit')],
    },
    {
        method: ['POST'],
        matcher: '/admin/spraay/trigger',
        middlewares: [requirePermission('payouts', 'edit')],
    },
];
