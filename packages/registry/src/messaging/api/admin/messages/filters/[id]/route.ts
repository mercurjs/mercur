import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { updateFilterRuleWorkflow } from "../../../../../workflows/messaging-filters/workflows/update-filter-rule"
import { deleteFilterRuleWorkflow } from "../../../../../workflows/messaging-filters/workflows/delete-filter-rule"
import { AdminUpdateFilterType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateFilterType>,
  res: MedusaResponse
) => {
  const ruleId = req.params.id

  const { result: rule } = await updateFilterRuleWorkflow.run({
    container: req.scope,
    input: {
      id: ruleId,
      ...req.validatedBody,
    },
  })

  res.json({ filter_rule: rule })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const ruleId = req.params.id

  await deleteFilterRuleWorkflow.run({
    container: req.scope,
    input: { id: ruleId },
  })

  res.json({ id: ruleId, deleted: true })
}
