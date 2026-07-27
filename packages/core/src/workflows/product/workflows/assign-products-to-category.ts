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
    const products = transform({ input }, ({ input }) => [
      ...(input.add ?? []).map((id) => ({ id, category_ids: [input.id] })),
      ...(input.remove ?? []).map((id) => ({ id, category_ids: [] as string[] })),
    ])

    when({ products }, ({ products }) => products.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: transform({ products }, ({ products }) => ({ products })),
      })
    })
  }
)
