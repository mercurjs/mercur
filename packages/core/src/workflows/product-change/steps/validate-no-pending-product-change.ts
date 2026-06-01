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
 * Enforces "one pending change per product". Filters the
 * `product_change` entity by `product_id` (denormalised column on the
 * change row) and `status = PENDING`. Throws if any input product
 * already has a pending change.
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

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: changes } = await query.graph({
      entity: "product_change",
      fields: ["id", "product_id", "status"],
      filters: {},
    })

    const conflicts = new Set<string>()
    for (const change of changes as Array<{
      id: string
      product_id?: string
      status?: string
    }>) {
      if (
        change.status === ProductChangeStatus.PENDING &&
        change.product_id &&
        product_ids.includes(change.product_id)
      ) {
        conflicts.add(change.product_id)
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
