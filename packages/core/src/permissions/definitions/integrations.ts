import { defineMercurPermissions } from "../registry"

export const integrationsPermissions = defineMercurPermissions([
  { key: "integrations", group: "integrations", surface: ["admin"], rights: ["view", "edit", "manage"] },
])
