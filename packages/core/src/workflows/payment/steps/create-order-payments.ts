import { BigNumberInput } from "@medusajs/framework/types"
import { Modules, PaymentSessionStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The payments to create.
 */
export type CreateOrderPaymentsStepInput = {
  /**
   * The ID of the payment collection the payment belongs to.
   */
  payment_collection_id: string
  /**
   * The ID of the provider holding the charge.
   */
  provider_id: string
  /**
   * The payment's currency code.
   */
  currency_code: string
  /**
   * The amount the payment is authorized for.
   */
  amount: BigNumberInput
  /**
   * The provider data of the charge the payment points at.
   */
  data: Record<string, unknown>
}[]

type SessionRow = CreateOrderPaymentsStepInput[number] & {
  status: PaymentSessionStatus
  authorized_at: Date
}

type PaymentRow = CreateOrderPaymentsStepInput[number] & {
  payment_session: string
}

// `createPaymentSession` always opens a new session at the provider, which
// would charge the customer a second time. These payments point at a charge
// that already exists, so their rows are written with the methods the module
// service generates for its models. They are on the service, not on
// `IPaymentModuleService`.
type PaymentRowService = {
  createPaymentSessions(data: SessionRow[]): Promise<{ id: string }[]>
  createPayments(
    data: PaymentRow[]
  ): Promise<{ id: string; payment_collection_id: string }[]>
  deletePayments(ids: string[]): Promise<void>
  deletePaymentSessions(ids: string[]): Promise<void>
}

export const createOrderPaymentsStepId = "create-order-payments"
/**
 * This step creates authorized payments for a charge that already exists at
 * the payment provider, without contacting the provider.
 *
 * @example
 * const payments = createOrderPaymentsStep([{
 *   payment_collection_id: "pay_col_123",
 *   provider_id: "pp_stripe_stripe",
 *   currency_code: "usd",
 *   amount: 40,
 *   data: { id: "pi_123" }
 * }])
 */
export const createOrderPaymentsStep = createStep(
  createOrderPaymentsStepId,
  async (input: CreateOrderPaymentsStepInput, { container }) => {
    if (!input?.length) {
      return new StepResponse([], { payment_ids: [], session_ids: [] })
    }

    const service = container.resolve(
      Modules.PAYMENT
    ) as unknown as PaymentRowService

    const authorizedAt = new Date()
    const sessions = await service.createPaymentSessions(
      input.map((payment) => ({
        ...payment,
        status: PaymentSessionStatus.AUTHORIZED,
        authorized_at: authorizedAt,
      }))
    )
    const sessionIds = sessions.map((session) => session.id)

    const payments = await service.createPayments(
      input.map((payment, index) => ({
        ...payment,
        payment_session: sessionIds[index],
      }))
    )

    return new StepResponse(payments, {
      payment_ids: payments.map((payment) => payment.id),
      session_ids: sessionIds,
    })
  },
  async (created, { container }) => {
    if (!created?.session_ids.length) {
      return
    }

    const service = container.resolve(
      Modules.PAYMENT
    ) as unknown as PaymentRowService

    await service.deletePayments(created.payment_ids)
    await service.deletePaymentSessions(created.session_ids)
  }
)
