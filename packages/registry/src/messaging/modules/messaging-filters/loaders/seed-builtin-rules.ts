import { LoaderOptions } from "@medusajs/framework/types"

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
    pattern: "(\\+?\\d{1,3}[-.\\s]?)?(\\(?\\d{2,4}\\)?[-.\\s]?)?\\d{3,4}[-.\\s]?\\d{3,4}",
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
  const service = container.resolve("messagingFilters") as any

  for (const rule of BUILTIN_RULES) {
    try {
      // Check if this built-in rule already exists (by pattern)
      const existing = await service.listFilterRules(
        { pattern: rule.pattern, is_builtin: true },
        { take: 1 }
      )

      if (!existing || existing.length === 0) {
        await service.createFilterRules(rule)
      }
    } catch {
      // Skip if already seeded — idempotent
    }
  }
}
