import { LoaderOptions, IMedusaInternalService } from "@medusajs/framework/types"
import { FilterRule } from "../models/filter-rule"

const BUILTIN_RULES = [
  {
    match_type: "regex",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    description: "Blocks email addresses to keep communication on-platform",
    is_builtin: true,
    is_enabled: true,
  },
  {
    match_type: "regex",
    pattern: "(?:\\+\\d{1,3}[-.\\s]?)?(?:\\(?\\d{2,4}\\)?[-.\\s]?)?\\d{3,4}[-.\\s]?\\d{4,}",
    description: "Blocks phone numbers to keep communication on-platform",
    is_builtin: true,
    is_enabled: true,
  },
  {
    match_type: "regex",
    pattern: "https?://[^\\s]+|www\\.[^\\s]+",
    description: "Blocks URLs and links to prevent spam and phishing",
    is_builtin: true,
    is_enabled: true,
  },
]

export default async function seedBuiltinRules({
  container,
}: LoaderOptions): Promise<void> {
  const service = container.resolve("filterRuleService") as IMedusaInternalService<typeof FilterRule>

  for (const rule of BUILTIN_RULES) {
    try {
      const [existing, count] = await service.listAndCount({
        pattern: rule.pattern,
        is_builtin: true,
      } as any, { take: 1 })

      if (count === 0) {
        await service.create(rule as any)
      }
    } catch {
      // Skip if already seeded
    }
  }
}
