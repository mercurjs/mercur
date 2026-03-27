import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_FILTERS_MODULE } from "../../../modules/messaging-filters"
import type MessagingFiltersModuleService from "../../../modules/messaging-filters/service"
import { getCompiledRuleset } from "../../../modules/messaging-filters/loaders/compile-filters"

type ValidateContentFilterInput = {
  body: string
  sender_id: string
  sender_type: "customer" | "seller"
  conversation_id: string
}

export const validateContentFilterStep = createStep(
  "validate-content-filter",
  async (input: ValidateContentFilterInput, { container }) => {
    const filtersService = container.resolve<MessagingFiltersModuleService>(
      MESSAGING_FILTERS_MODULE
    )

    const ruleset = getCompiledRuleset()
    const result = filtersService.evaluateMessage(input.body, ruleset)

    if (result.matched) {
      // Log the blocked message
      await filtersService.createBlockedMessageLogs({
        sender_id: input.sender_id,
        sender_type: input.sender_type,
        conversation_id: input.conversation_id,
        matched_rule_id: result.rule_id!,
        message_body: input.body,
      })

      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Your message could not be sent. Please revise and try again."
      )
    }

    return new StepResponse(undefined)
  }
)
