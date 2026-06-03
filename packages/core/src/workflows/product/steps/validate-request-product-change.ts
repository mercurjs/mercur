import { MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateRequestProductChangeStepInput = {
  product: { id: string; status: string } | undefined
}

export const validateRequestProductChangeStepId =
  "validate-request-product-change"

/**
 * Guard for `requestProductChangeWorkflow`. Same eligibility window
 * as confirm + reject: `proposed` is the publish-approval state where
 * an operator can ask the seller to revise the submission.
 */
export const validateRequestProductChangeStep = createStep(
  validateRequestProductChangeStepId,
  async ({ product }: ValidateRequestProductChangeStepInput) => {
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Product was not found",
      )
    }
    if (product.status !== ProductStatus.PROPOSED) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot request changes on product ${product.id}: only \`proposed\` products are eligible (current status: ${product.status}).`,
      )
    }
    return new StepResponse(void 0)
  },
)
