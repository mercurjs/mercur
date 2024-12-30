import { MedusaService } from '@medusajs/framework/utils'

import { ComissionRate, ComissionRule } from './models'
import { ComissionLine } from './models/comission_line'
import { ComissionCalculationContext, ComissionRuleDTO } from './types'

class ComissionModuleService extends MedusaService({
  ComissionRate,
  ComissionRule,
  ComissionLine
}) {
  private async selectComissionRule(reference: string, reference_id: string) {
    const [rule] = await this.listComissionRules(
      { reference, reference_id },
      { relations: ['rate'] }
    )

    return rule
  }

  /**
   * Looks for first applicable ComissionRule for given context. The queries are executed in assumed priority order.
   * @param ctx Calculation context
   * @returns ComissionRule applicable for given context or null
   */
  async selectComissionForProductLine(
    ctx: ComissionCalculationContext
  ): Promise<ComissionRuleDTO | null> {
    const ruleQueries = [
      {
        reference: 'seller+product_type',
        reference_id: `${ctx.seller_id}+${ctx.product_type_id}`
      },
      {
        reference: 'seller+product_category',
        reference_id: `${ctx.seller_id}+${ctx.product_category_id}`
      },
      { reference: 'seller', reference_id: ctx.seller_id },
      { reference: 'product_type', reference_id: ctx.product_type_id },
      { reference: 'product_category', reference_id: ctx.product_category_id },
      { reference: 'site', reference_id: '' }
    ]

    for (const { reference, reference_id } of ruleQueries) {
      const rule = await this.selectComissionRule(reference, reference_id)
      if (rule) {
        return rule
      }
    }

    return null
  }
}

export default ComissionModuleService
