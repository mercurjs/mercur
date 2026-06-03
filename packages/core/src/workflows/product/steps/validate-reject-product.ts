import { MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateRejectProductStepInput = {
  product: { id: string; status: string } | undefined
}

export const validateRejectProductStepId = "validate-reject-product"

/**
 * Guard for `rejectProductWorkflow`. Only `proposed` products can be
 * rejected — already-published products belong to the marketplace
 * catalog and rejecting them would silently disappear from the
 * storefront with no audit signal. Use the standard archive flow
 * for that case instead.
 */
export const validateRejectProductStep = createStep(
  validateRejectProductStepId,
  async ({ product }: ValidateRejectProductStepInput) => {
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Product was not found",
      )
    }
    if (product.status !== ProductStatus.PROPOSED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot reject product ${product.id}: only \`proposed\` products are eligible for rejection (current status: ${product.status}).`,
      )
    }
    return new StepResponse(void 0)
  },
)
