import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminPayoutNotificationListResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminPayoutNotificationListResponse>
) => {
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)
  const [rows, count] = await resolveConnector(req.scope).listAndCountConnectorNotifications(
    {},
    { skip: offset, take: limit, order: { created_at: "DESC" } }
  )
  res.json({
    notifications: rows.map((row) => ({
      id: row.id,
      type: row.type,
      url: row.url,
      attempts: row.attempts,
      response_status: row.response_status,
      error: row.error,
      delivered: row.delivered,
      created_at: row.created_at,
    })),
    count,
    offset,
    limit,
  })
}
