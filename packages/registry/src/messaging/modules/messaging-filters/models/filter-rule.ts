import { model } from "@medusajs/framework/utils"

export const FilterRule = model.define("filter_rule", {
  id: model.id({ prefix: "filt" }).primaryKey(),
  match_type: model.enum(["exact", "contains", "regex"]),
  pattern: model.text(),
  is_builtin: model.boolean().default(false),
  is_enabled: model.boolean().default(true),
  description: model.text().nullable(),
})
