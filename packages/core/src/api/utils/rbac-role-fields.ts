import { FeatureFlag } from "@medusajs/framework/utils"

// The seller_member <-> rbac_role link is only registered while the rbac flag is
// on, so requesting `rbac_role.*` without it fails. Call this at request time,
// not at module load: feature flags aren't resolved when route files are imported.
export const withRbacRoleFields = (fields: string[]): string[] =>
  FeatureFlag.isFeatureEnabled("rbac") ? [...fields, "rbac_role.*"] : fields
