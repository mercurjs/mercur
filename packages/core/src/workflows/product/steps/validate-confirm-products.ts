import { MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateConfirmProductsStepInput = {
  products: Array<{ id: string; status: string }>
}

export const validateConfirmProductsStepId = "validate-confirm-products"

/**
 * Guard for `confirmProductsWorkflow`. Only `proposed` products can be
 * confirmed — already-published or rejected products would either be a
 * no-op or a backwards transition.
 */
export const validateConfirmProductsStep = createStep(
  validateConfirmProductsStepId,
  async ({ products }: ValidateConfirmProductsStepInput) => {
    const invalid = products.filter(
      (p) => p.status !== ProductStatus.PROPOSED,
    )
    if (invalid.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot confirm product(s) [${invalid
          .map((p) => `${p.id} (status: ${p.status})`)
          .join(", ")}]: only \`proposed\` products are eligible for confirmation.`,
      )
    }
    return new StepResponse(void 0)
  },
)
