/**
 * Extend MedusaRequest with custom properties used by vendor promotions middleware
 */
declare module "@medusajs/framework" {
  interface MedusaRequest {
    /**
     * Normalized rule_type value set by vendor promotion middleware.
     * Converts hyphenated format (target-rules) to underscored format (target_rules)
     * to match Medusa's RuleType enum standard.
     */
    normalized_rule_type?: string;
  }
}

