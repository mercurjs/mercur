import { defineMercurPermissions } from "../registry"

export const workflowExecutionsPermissions = defineMercurPermissions([
  { key: "workflow_executions", group: "workflow-executions", surface: ["admin"], rights: ["view"] },
])
