import { MedusaService } from "@medusajs/framework/utils";

import { CommissionRate, CommissionRule } from "./models";
import { CommissionLine } from "./models/commission_line";
import {
  CommissionCalculationContext,
  CommissionRuleDTO,
} from "@mercurjs/framework";

class CommissionModuleService extends MedusaService({
  CommissionRate,
  CommissionRule,
  CommissionLine,
}) {
  private async selectCommissionRule(reference: string, reference_id: string) {
    const [rule] = await this.listCommissionRules(
      { reference, reference_id, is_active: true, deleted_at: null },
      { relations: ["rate"] }
    );

    return rule;
  }

  /**
   * Looks for first applicable CommissionRule for given context. The queries are executed in assumed priority order.
   * @param ctx Calculation context
   * @returns CommissionRule applicable for given context or null
   */
  async selectCommissionForProductLine(
    ctx: CommissionCalculationContext
  ): Promise<CommissionRuleDTO | null> {
    const ruleQueries = [
      {
        reference: "seller+product_type",
        reference_id: `${ctx.seller_id}+${ctx.product_type_id}`,
      },
      {
        reference: "seller+product_category",
        reference_id: `${ctx.seller_id}+${ctx.product_category_id}`,
      },
      { reference: "seller", reference_id: ctx.seller_id },
      { reference: "product_type", reference_id: ctx.product_type_id },
      { reference: "product_category", reference_id: ctx.product_category_id },
      { reference: "site", reference_id: "" },
    ];

    for (const { reference, reference_id } of ruleQueries) {
      const rule = await this.selectCommissionRule(reference, reference_id);
      if (rule) {
        return rule;
      }
    }

    return null;
  }
}

export default CommissionModuleService;
