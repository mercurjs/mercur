import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

export type GetOffersListWorkflowInput = {
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: {
    skip?: number
    take?: number
    order?: Record<string, string>
  }
}

export const getOffersListWorkflowId = "get-offers-list"

export const getOffersListWorkflow = createWorkflow(
  getOffersListWorkflowId,
  (input: GetOffersListWorkflowInput) => {
    const { data: offers, metadata } = useQueryGraphStep({
      entity: "offer",
      fields: input.fields,
      filters: input.filters,
      pagination: input.pagination,
    })

    return new WorkflowResponse({
      offers,
      count: metadata?.count ?? 0,
      offset: metadata?.skip ?? 0,
      limit: metadata?.take ?? 0,
    })
  }
)
