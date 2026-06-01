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
 * Enforces "one pending change per product". Queries the
 * `product_change` entity directly with `status = PENDING` and joins
 * the linked product through the `product_change_link` pivot. Throws
 * if any of the input products already has a pending change linked.
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

    const { data: changes } = await query.graph({
      entity: "product_change",
      fields: ["id", "status", "product.id"],
      filters: { status: ProductChangeStatus.PENDING },
    })

    const conflicts = new Set<string>()
    for (const change of changes as Array<{
      id: string
      status?: string
      product?: { id?: string } | Array<{ id?: string }> | null
    }>) {
      const products = Array.isArray(change.product)
        ? change.product
        : change.product
          ? [change.product]
          : []
      for (const p of products) {
        if (p.id && product_ids.includes(p.id)) {
          conflicts.add(p.id)
        }
      }
    }

    if (conflicts.size) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product(s) [${[...conflicts].join(", ")}] already have a pending product change. Resolve it before opening a new one.`,
      )
    }

    return new StepResponse(void 0)
  },
)
