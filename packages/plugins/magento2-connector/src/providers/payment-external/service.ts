import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  BigNumber,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"

import { ExternalPaymentSessionData } from "../../types"

const toNumber = (value: unknown): number =>
  new BigNumber(value as never).numeric

/**
 * Records a payment that an external storefront already captured. Nothing is
 * charged here: the storefront passes the reference and amount of its own
 * capture in the session data, and every provider action succeeds so that
 * Mercur's split-order, commission, and payout pipeline runs on that amount.
 */
class ExternalPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "external"

  constructor(container: Record<string, unknown>, options: Record<string, unknown> = {}) {
    super(container, options)
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const data = (input.data ?? {}) as ExternalPaymentSessionData
    const id = data.reference ?? `ext_${Date.now()}`

    return {
      id,
      status: PaymentSessionStatus.CAPTURED,
      data: {
        ...data,
        reference: id,
        amount: toNumber(input.amount),
        currency_code: input.currency_code,
        captured_at: data.captured_at ?? new Date().toISOString(),
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...(input.data ?? {}),
        amount: toNumber(input.amount),
        currency_code: input.currency_code,
      },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    return { status: PaymentSessionStatus.CAPTURED, data: input.data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as ExternalPaymentSessionData

    return {
      data: {
        ...data,
        refunds: [...(data.refunds ?? []), { amount: toNumber(input.amount) }],
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    return { status: PaymentSessionStatus.CAPTURED, data: input.data }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default ExternalPaymentProviderService
