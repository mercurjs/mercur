import { Query } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ProductChangeStatus } from "@mercurjs/types"

export const validateNoPendingProductChangeStepId =
  "pc-validate-no-pending-product-change"

type ValidateNoPendingProductChangeStepInput = {
  product_ids: string[]
}

/**
 * Enforces "one pending change per product" by reading through the
 * `product_change_link` pivot. Throws if any of the input products
 * already has a `PENDING` change linked.
 */
export const validateNoPendingProductChangeStep = createStep(
  validateNoPendingProductChangeStepId,
  async (
    { product_ids }: ValidateNoPendingProductChangeStepInput,
    { container },
  ) => {
    if (!product_ids.length) {
      return new StepResponse(void 0)
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "changes.id", "changes.status"],
      filters: { id: product_ids },
    })

    const conflicts: string[] = []
    for (const product of products as Array<{
      id: string
      changes?: Array<{ id: string; status?: string | null }>
    }>) {
      const hasPending = (product.changes ?? []).some(
        (c) => c.status === ProductChangeStatus.PENDING,
      )
      if (hasPending) {
        conflicts.push(product.id)
      }
    }

    if (conflicts.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product(s) [${conflicts.join(", ")}] already have a pending product change. Resolve it before opening a new one.`,
      )
    }

    return new StepResponse(void 0)
  },
)
