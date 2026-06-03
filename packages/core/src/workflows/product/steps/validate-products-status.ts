import { MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateProductsStatusStepInput = {
  products: Array<{ id: string; status: string }>
  expected_status: ProductStatus | ProductStatus[]
}

export const validateProductsStatusStepId = "validate-products-status"

/**
 * Guard that all input products are in one of the expected statuses.
 * Used by the publish-approval workflows (`confirmProductsWorkflow`,
 * `rejectProductWorkflow`, `requestProductChangeWorkflow`) which all
 * require `proposed` as the only eligible state. Existence is
 * presumed validated upstream by `useQueryGraphStep` with
 * `throwIfKeyNotFound: true`.
 */
export const validateProductsStatusStep = createStep(
  validateProductsStatusStepId,
  async ({ products, expected_status }: ValidateProductsStatusStepInput) => {
    const allowed = Array.isArray(expected_status)
      ? new Set<string>(expected_status)
      : new Set<string>([expected_status])

    const invalid = products.filter((p) => !allowed.has(p.status))

    if (invalid.length) {
      const expected = [...allowed].join(", ")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Product(s) [${invalid
          .map((p) => `${p.id} (status: ${p.status})`)
          .join(", ")}] are not in an eligible status. Expected one of: ${expected}.`,
      )
    }

    return new StepResponse(void 0)
  },
)
