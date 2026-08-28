import {
  ContainerRegistrationKeys,
  isDefined,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ProductChangeStatus } from "@mercurjs/types"

export const validateNoPendingProductChangeStepId =
  "pc-validate-no-pending-product-change"

type ValidateNoPendingProductChangeStepInput = {
  product_ids: string[]
  /**
   * When set, only changes created by this actor conflict. Omitting it keeps
   * the product-wide behaviour for external callers.
   */
  created_by?: string | null
}

export const validateNoPendingProductChangeStep = createStep(
  validateNoPendingProductChangeStepId,
  async (
    { product_ids, created_by }: ValidateNoPendingProductChangeStepInput,
    { container },
  ) => {
    if (!product_ids.length) {
      return new StepResponse(void 0)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: changes } = await query.graph({
      entity: "product_change",
      fields: ["id", "product_id", "created_by"],
      filters: {
        product_id: product_ids,
        status: ProductChangeStatus.PENDING,
        ...(isDefined(created_by) ? { created_by } : {}),
      },
    })

    const conflicts = new Set(
      (changes as Array<{ product_id?: string }>)
        .map((change) => change.product_id)
        .filter(Boolean) as string[],
    )

    if (conflicts.size) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `There is already an active update request for this product. Only one request can be active at a time.`,
      )
    }

    return new StepResponse(void 0)
  },
)
