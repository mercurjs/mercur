import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /admin/notifications
 * operationId: "AdminListNotifications"
 * summary: "List Notifications"
 * description: "Retrieves a list of admin notifications from the feed channel."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             notifications:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminNotification"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Admin Notifications
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminNotificationListParams>,
  res: MedusaResponse<HttpTypes.AdminNotificationListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: notifications, metadata } = await query.graph({
    entity: 'notification',
    filters: { ...req.filterableFields, channel: 'feed' },
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    notifications,
    count: metadata?.count ?? notifications.length,
    offset: metadata?.skip ?? req.queryConfig.pagination?.skip ?? 0,
    limit: metadata?.take ?? req.queryConfig.pagination?.take ?? 0
  })
}
