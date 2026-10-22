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
  Logger,
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

const asSessionData = (data: unknown): ExternalPaymentSessionData =>
  (data ?? {}) as ExternalPaymentSessionData

const statusOf = (data: ExternalPaymentSessionData): PaymentSessionStatus => {
  if (data.canceled_at) {
    return PaymentSessionStatus.CANCELED
  }
  if (data.captured_at) {
    return PaymentSessionStatus.CAPTURED
  }
  return PaymentSessionStatus.AUTHORIZED
}

type InjectedDependencies = {
  logger: Logger
}

type ExternalPaymentOptions = Record<string, never>

/**
 * Tracks a payment the external storefront holds; no provider is charged.
 * The storefront authorizes at placement and reports the capture later, or
 * passes `captured_at` up front when it already settled.
 */
class ExternalPaymentProviderService extends AbstractPaymentProvider<ExternalPaymentOptions> {
  static identifier = "external"

  constructor(container: InjectedDependencies, options: ExternalPaymentOptions = {}) {
    super(container, options)
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const data = asSessionData(input.data)
    const id = data.reference ?? `ext_${Date.now()}`
    const next: ExternalPaymentSessionData = {
      ...data,
      reference: id,
      amount: toNumber(input.amount),
      currency_code: input.currency_code,
      authorized_at: data.authorized_at ?? new Date().toISOString(),
    }

    return { id, status: statusOf(next), data: next }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const next: ExternalPaymentSessionData = {
      ...asSessionData(input.data),
      amount: toNumber(input.amount),
      currency_code: input.currency_code,
    }

    return { status: statusOf(next), data: next }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const next: ExternalPaymentSessionData = {
      ...asSessionData(input.data),
      authorized_at:
        asSessionData(input.data).authorized_at ?? new Date().toISOString(),
    }

    return { status: statusOf(next), data: next }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = asSessionData(input.data)

    return {
      data: { ...data, captured_at: data.captured_at ?? new Date().toISOString() },
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = asSessionData(input.data)

    return {
      data: {
        ...data,
        refunds: [...(data.refunds ?? []), { amount: toNumber(input.amount) }],
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = asSessionData(input.data)

    return {
      data: { ...data, canceled_at: data.canceled_at ?? new Date().toISOString() },
    }
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
    return { status: statusOf(asSessionData(input.data)), data: input.data }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default ExternalPaymentProviderService
