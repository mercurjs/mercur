import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminRequestResponse } from "../../../../../../types"
import { rejectRequestWorkflow } from "../../../../../../workflows/requests/workflows"
import { AdminReviewNoteType } from "../../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<AdminReviewNoteType>,
  res: MedusaResponse<AdminRequestResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const alias = req.params.type!
  const entityId = req.params.id!

  await rejectRequestWorkflow(req.scope).run({
    input: {
      alias,
      entity_id: entityId,
      reviewer_id: req.auth_context.actor_id,
      reviewer_note: req.validatedBody?.reviewer_note,
    },
  })

  const {
    data: [entity],
  } = await query.graph({
    entity: alias,
    fields: ["id", "custom_fields.*"],
    filters: { id: entityId },
  })

  res.json({ request: entity })
}
