import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { AdminCommissionAggregate } from '@mercurjs/framework'

import { findCommissionRulesStep } from '../steps'
import { findCommissionReferencesStep } from '../steps/find-commission-references'

export const listCommissionRulesWorkflow = createWorkflow(
  'list-commission-rules',
  function (input: {
    pagination?: {
      skip: number
      take?: number
      order?: Record<string, any>
    }
    ids?: string[]
  }) {
    const data = findCommissionRulesStep(input)
    const references = findCommissionReferencesStep(data.commission_rules)

    const result = transform({ data, references }, ({ data, references }) => {
      return data.commission_rules.map((rule) => {
        let ref_value = ''

        if (rule.reference === 'seller') {
          ref_value = references.sellers.find(
            (ref) => ref.id === rule.reference_id
          ).value
        }

        if (rule.reference === 'product_type') {
          ref_value = references.productTypes.find(
            (ref) => ref.id === rule.reference_id
          ).value
        }

        if (rule.reference === 'product_category') {
          ref_value = references.productCategories.find(
            (ref) => ref.id === rule.reference_id
          ).value
        }

        if (rule.reference === 'seller+product_category') {
          const ids = rule.reference_id.split('+')
          ref_value =
            references.sellers.find((ref) => ref.id === ids[0]).value +
            ' + ' +
            references.productCategories.find((ref) => ref.id === ids[1]).value
        }

        if (rule.reference === 'seller+product_type') {
          const ids = rule.reference_id.split('+')
          ref_value =
            references.sellers.find((ref) => ref.id === ids[0]).value +
            ' + ' +
            references.productTypes.find((ref) => ref.id === ids[1]).value
        }

        return {
          ...rule,
          ref_value
        }
      })
    })

    return new WorkflowResponse({
      commission_rules: result as AdminCommissionAggregate[],
      count: data.count
    })
  }
)
