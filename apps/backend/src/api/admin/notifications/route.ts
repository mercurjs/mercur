import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities
} from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminNotificationListParams>,
  res: MedusaResponse<HttpTypes.AdminNotificationListResponse>
) => {
  const { rows: notifications, metadata } = await refetchEntities(
    'notification',
    { ...req.filterableFields, channel: 'feed' },
    req.scope,
    req.queryConfig.fields,
    req.queryConfig.pagination
  )

  res.json({
    notifications,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take
  })
}
