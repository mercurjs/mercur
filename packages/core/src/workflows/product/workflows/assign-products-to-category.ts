import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

export type AssignProductsToCategoryWorkflowInput = {
  id: string
  add?: string[]
  remove?: string[]
}

export const assignProductsToCategoryWorkflowId =
  "mercur-assign-products-to-category"

/**
 * Assigns products to a single category. Adding a product replaces any
 * category it already belongs to, keeping every product in exactly one
 * category at a time.
 */
export const assignProductsToCategoryWorkflow = createWorkflow(
  assignProductsToCategoryWorkflowId,
  (
    input: WorkflowData<AssignProductsToCategoryWorkflowInput>
  ): WorkflowData<void> => {
    when({ input }, ({ input }) => (input.add ?? []).length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: transform({ input }, ({ input }) => ({
          selector: { id: input.add ?? [] },
          update: { category_ids: [input.id] },
        })),
      })
    })

    when({ input }, ({ input }) => (input.remove ?? []).length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: transform({ input }, ({ input }) => ({
          selector: { id: input.remove ?? [] },
          update: { category_ids: [] as string[] },
        })),
      })
    })
  }
)
