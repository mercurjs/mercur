import { useQueryGraphStep } from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when
} from '@medusajs/workflows-sdk'

import { CreateCommissionRuleDTO } from '@mercurjs/framework'

import { createCommissionRuleStep, deleteCommissionRuleStep } from '../steps'

export const upsertDefaultCommissionRuleWorkflow = createWorkflow(
  'upsert-default-commission-rule',
  function (input: CreateCommissionRuleDTO) {
    const existingRule = useQueryGraphStep({
      entity: 'commission_rule',
      fields: ['id'],
      filters: {
        reference: 'site'
      }
    })

    when(existingRule, (existingRule) => !!existingRule.data.length).then(
      () => {
        const id = transform(
          existingRule,
          (existingRule) => existingRule.data[0]
        ).id
        deleteCommissionRuleStep(id)
      }
    )

    return new WorkflowResponse(createCommissionRuleStep(input))
  }
)
