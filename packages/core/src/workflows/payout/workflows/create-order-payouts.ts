import { FulfillmentStatus } from "@medusajs/framework/types"
import {
  Hook,
  ReturnWorkflow,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutDTO, PayoutModuleEvents } from "@mercurjs/types"

import { dispatchPayoutsStep } from "../steps/dispatch-payout"
import { evaluateOrderPayoutsStep } from "../steps/evaluate-order-payouts"
import { failedPayoutEvents } from "./process-payout"

export type CreateOrderPayoutsWorkflowInput = {
  order_ids: string[]
  /**
   * How far an order has to be fulfilled before its seller is paid out.
   * Defaults to `fulfilled`.
   */
  required_fulfillment_status?: FulfillmentStatus
}

export type CreateOrderPayoutsWorkflowOutput = {
  counts: Record<string, number>
  payouts: PayoutDTO[]
}

export const createOrderPayoutsWorkflowId = "create-order-payouts"

/**
 * Pays each order's seller their share: the order total minus commission,
 * net of refunds that landed before the payout. An order that is not ready
 * (no active payout account, not fulfilled, payment not captured) gets a
 * payout on hold, which the next run re-evaluates; a canceled one is aborted.
 */
export const createOrderPayoutsWorkflow: ReturnWorkflow<
  CreateOrderPayoutsWorkflowInput,
  CreateOrderPayoutsWorkflowOutput,
  [Hook<"payoutsCreated", { order_ids: string[]; payouts: PayoutDTO[] }, unknown>]
> = createWorkflow(
  createOrderPayoutsWorkflowId,
  function (input: CreateOrderPayoutsWorkflowInput) {
    const evaluateInput = transform({ input }, ({ input }) => ({
      order_ids: input.order_ids,
      required_fulfillment_status: input.required_fulfillment_status ?? "fulfilled",
    }))

    const evaluation = evaluateOrderPayoutsStep(evaluateInput)

    const payouts = dispatchPayoutsStep({ payout_ids: evaluation.pending })

    const failed = transform({ payouts }, ({ payouts }) => failedPayoutEvents(payouts))

    emitEventStep({ eventName: PayoutModuleEvents.PAYOUT_FAILED, data: failed })

    const result = transform({ evaluation, payouts }, ({ evaluation, payouts }) => ({
      counts: evaluation.counts,
      payouts,
    }))

    const payoutsCreated = createHook("payoutsCreated", {
      order_ids: input.order_ids,
      payouts,
    })

    return new WorkflowResponse(result, { hooks: [payoutsCreated] })
  }
)
