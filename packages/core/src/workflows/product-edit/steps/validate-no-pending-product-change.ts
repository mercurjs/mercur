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
        `There is already an active update request for this product. Only one request can be active at a time.`,
      )
    }

    return new StepResponse(void 0)
  },
)
