import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { notifyOperatorWorkflow } from "../../../../../workflows/notify-operator"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { result } = await notifyOperatorWorkflow(req.scope).run({
    input: { type: "test", payload: { sent_at: new Date().toISOString(), actor_id: req.auth_context?.actor_id ?? null } },
  })
  res.json({ notification: result })
}
