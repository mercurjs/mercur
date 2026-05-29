import { deduplicate } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import { formatProducts, type FormattedProduct } from "../utils/format-products"

export type GetProductsWithDetailsWorkflowInput = {
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: {
    take?: number
    skip?: number
    order?: Record<string, "ASC" | "DESC">
  }
}

export type GetProductsWithDetailsWorkflowOutput = {
  data: FormattedProduct<Record<string, unknown>>[]
  metadata?: {
    count: number
    skip: number
    take: number
  }
}

export const getProductsWithDetailsWorkflowId = "get-products-with-details"

/**
 * Read-side wrapper that the SPEC-008 spec calls out (`Worked example:
 * getProductsWithDetailsWorkflow`). Pattern-match
 * `medusa/.../order/workflows/get-order-detail.ts`: include the
 * computed-field source paths in the `useQueryGraphStep` `fields` arg
 * unconditionally, then a `transform` step decorates each row with the
 * Mercur computed fields via `formatProducts`.
 *
 * `*changes.status` is appended to every caller's field tree so the
 * computed `requires_action` boolean resolves even when the caller does
 * not mention `changes` in its own selection. Clients **do not** put
 * `*requires_action` in their field tree — it is part of this
 * wrapper's response contract, not a joiner alias.
 *
 * Every admin / vendor / store product list and detail route should
 * call this wrapper instead of `useQueryGraphStep` directly so the
 * computed surface stays consistent.
 */
export const getProductsWithDetailsWorkflow: ReturnWorkflow<
  GetProductsWithDetailsWorkflowInput,
  GetProductsWithDetailsWorkflowOutput,
  []
> = createWorkflow(
  getProductsWithDetailsWorkflowId,
  function (input: GetProductsWithDetailsWorkflowInput) {
    const fields = transform({ input }, ({ input }) =>
      deduplicate([
        ...(input.fields ?? []),
        "id",
        "changes.id",
        "changes.status",
      ]),
    )

    const filters = transform(
      { input },
      ({ input }) => (input.filters ?? {}) as Record<string, unknown>,
    )

    const pagination = transform(
      { input },
      ({ input }) => input.pagination ?? {},
    )

    const queryResult = useQueryGraphStep({
      entity: "product",
      fields,
      filters,
      pagination,
    }).config({ name: "get-products-with-details-query" })

    const enriched = transform({ queryResult }, ({ queryResult }) => {
      const raw =
        (queryResult as { data?: unknown[] }).data ?? ([] as unknown[])
      const metadata = (queryResult as { metadata?: unknown }).metadata
      return {
        data: formatProducts(
          raw as Array<{ changes?: Array<{ status?: string | null }> }>,
        ),
        metadata,
      } as GetProductsWithDetailsWorkflowOutput
    })

    return new WorkflowResponse(enriched)
  },
)
