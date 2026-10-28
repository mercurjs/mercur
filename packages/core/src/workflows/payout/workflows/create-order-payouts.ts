import { FulfillmentStatus, LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  Hook,
  ReturnWorkflow,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep, emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { MercurModules, PayoutDTO, PayoutModuleEvents, PayoutStatus } from "@mercurjs/types"

import { createPayoutsStep, processPayoutsStep, updatePayoutsStep } from "../steps"
import {
  CommissionLine,
  PAYOUT_ORDER_FIELDS,
  PayoutOrder,
  commissionLineFilters,
  planOrderPayouts,
} from "../utils/payout-amounts"
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
 * payout on hold, which the next run re-decides; a canceled one is aborted.
 */
export const createOrderPayoutsWorkflow: ReturnWorkflow<
  CreateOrderPayoutsWorkflowInput,
  CreateOrderPayoutsWorkflowOutput,
  [Hook<"payoutsCreated", { order_ids: string[]; payouts: PayoutDTO[] }, unknown>]
> = createWorkflow(createOrderPayoutsWorkflowId, function (input: CreateOrderPayoutsWorkflowInput) {
  const loaded = when("orders-to-pay-out", { input }, ({ input }) => input.order_ids.length > 0).then(() => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: PAYOUT_ORDER_FIELDS,
      filters: { id: input.order_ids },
    }).config({ name: "payout-orders-query" })

    const { data: payouts } = useQueryGraphStep({
      entity: "payout",
      fields: ["*"],
      filters: { order_id: input.order_ids },
    }).config({ name: "existing-payouts-query" })

    return transform({ orders, payouts }, ({ orders, payouts }) => ({
      orders: orders as unknown as PayoutOrder[],
      payouts: payouts as unknown as PayoutDTO[],
    }))
  })

  const commissionFilters = transform({ loaded }, ({ loaded }) => commissionLineFilters(loaded?.orders ?? []))

  const commissionLines = when(
    "orders-with-commission-lines",
    { commissionFilters },
    ({ commissionFilters }) => commissionFilters.$or.length > 0
  ).then(() => {
    const { data } = useQueryGraphStep({
      entity: "commission_line",
      fields: ["amount", "item_id", "shipping_method_id"],
      filters: commissionFilters,
    }).config({ name: "payout-commission-lines-query" })

    return data
  })

  const plan = transform({ input, loaded, commissionLines }, ({ input, loaded, commissionLines }) =>
    planOrderPayouts({
      orders: loaded?.orders ?? [],
      payouts: loaded?.payouts ?? [],
      commission_lines: (commissionLines ?? []) as unknown as CommissionLine[],
      required_fulfillment_status: input.required_fulfillment_status ?? "fulfilled",
    })
  )

  const created = createPayoutsStep(
    transform({ plan }, ({ plan }) => plan.create.map(({ seller_id: _seller, ...payout }) => payout))
  )
  const updated = updatePayoutsStep(transform({ plan }, ({ plan }) => plan.update))

  const links = transform({ plan, created }, ({ plan, created }) => {
    const sellerByOrder = new Map(plan.create.map((row) => [row.order_id, row.seller_id]))

    return created.flatMap((payout): LinkDefinition[] => [
      {
        [MercurModules.PAYOUT]: { payout_id: payout.id },
        [MercurModules.SELLER]: { seller_id: sellerByOrder.get(payout.order_id as string) as string },
      },
      {
        [Modules.ORDER]: { order_id: payout.order_id as string },
        [MercurModules.PAYOUT]: { payout_id: payout.id },
      },
    ])
  })
  createRemoteLinkStep(links)

  const pendingIds = transform({ created, updated }, ({ created, updated }) =>
    [...created, ...updated].filter((payout) => payout.status === PayoutStatus.PENDING).map((payout) => payout.id)
  )
  const payouts = processPayoutsStep({ ids: pendingIds })

  emitEventStep({
    eventName: PayoutModuleEvents.PAYOUT_FAILED,
    data: transform({ payouts }, ({ payouts }) => failedPayoutEvents(payouts)),
  })

  const output = transform({ plan, payouts }, ({ plan, payouts }): CreateOrderPayoutsWorkflowOutput => ({
    counts: plan.counts,
    payouts,
  }))

  const payoutsCreated = createHook("payoutsCreated", {
    order_ids: input.order_ids,
    payouts: output.payouts,
  })

  return new WorkflowResponse(output, { hooks: [payoutsCreated] })
})
