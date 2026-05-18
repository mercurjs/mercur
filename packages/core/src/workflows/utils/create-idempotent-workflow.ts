import { WorkflowManager } from "@medusajs/framework/orchestration"
import { createWorkflow } from "@medusajs/framework/workflows-sdk"

/**
 * Drop-in replacement for `createWorkflow` that unregisters any existing
 * workflow with the same id before registering. Lets Mercur define
 * workflows that share an id with Medusa's core-flows (e.g. `create-products`)
 * without `WorkflowManager.register` throwing on the duplicate, and is a
 * no-op safety net for ids that don't collide.
 */
export const createIdempotentWorkflow: typeof createWorkflow = ((
  nameOrConfig: Parameters<typeof createWorkflow>[0],
  composer: Parameters<typeof createWorkflow>[1]
) => {
  const id =
    typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.name
  WorkflowManager.unregister(id)
  return createWorkflow(nameOrConfig as never, composer as never)
}) as typeof createWorkflow
