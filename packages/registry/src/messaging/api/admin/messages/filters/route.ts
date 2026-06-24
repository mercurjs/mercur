import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_FILTERS_MODULE } from "../../../../modules/messaging-filters"
import type MessagingFiltersModuleService from "../../../../modules/messaging-filters/service"
import { createFilterRuleWorkflow } from "../../../../workflows/messaging-filters/workflows/create-filter-rule"
import { AdminCreateFilterType, AdminListFiltersType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminListFiltersType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MessagingFiltersModuleService>(
    MESSAGING_FILTERS_MODULE
  )

  const limit = req.validatedQuery?.limit ?? 20

  const [rules, count] = await service.listAndCountFilterRules(
    {},
    {
      take: limit,
      order: { created_at: "ASC" },
    }
  )

  res.json({ filter_rules: rules, count })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateFilterType>,
  res: MedusaResponse
) => {
  const { match_type, pattern, description, is_enabled } = req.validatedBody

  // Custom rules cannot use regex match type
  if (match_type === "regex" as any) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Regex match type is reserved for built-in rules only"
    )
  }

  const { result: rule } = await createFilterRuleWorkflow.run({
    container: req.scope,
    input: {
      match_type,
      pattern,
      description: description ?? null,
      is_enabled: is_enabled ?? true,
      is_builtin: false,
    },
  })

  res.status(201).json({ filter_rule: rule })
}
