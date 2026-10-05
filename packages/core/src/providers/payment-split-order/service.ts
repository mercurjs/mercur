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
  IPaymentProvider,
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
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"

import { SPLIT_ORDER_PAYMENT_DATA_KEY } from "./constants"

export type SplitOrderPaymentReference = {
  /** Provider that holds the cart's real payment, e.g. `pp_stripe_stripe`. */
  provider_id: string
  payment_id: string
  /** Whether the cart payment was already captured when this share was created. */
  captured: boolean
}

type ProviderData = Record<string, unknown> | undefined

/**
 * Payment provider for one order's share of a cart payment.
 *
 * The customer pays a cart once, through a single payment at the real
 * provider. Every order the cart splits into gets its own payment collection
 * and a payment on this provider, whose data is a copy of the cart payment's
 * provider data. Refunds are forwarded to the real provider, so refunding a
 * share refunds that amount of the customer's charge. Capturing forwards too,
 * which captures the whole charge: an authorization cannot be captured in
 * parts. Canceling a share is recorded only, because voiding at the provider
 * would release the authorization the other orders still rely on.
 */
export class SplitOrderPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "split-order"

  constructor(
    container: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    super(container, options)
  }

  protected resolveTarget(data: ProviderData): {
    provider: IPaymentProvider
    reference: SplitOrderPaymentReference
    data: Record<string, unknown>
  } {
    const { [SPLIT_ORDER_PAYMENT_DATA_KEY]: reference, ...providerData } =
      data ?? {}
    const reference_ = reference as SplitOrderPaymentReference | undefined

    if (!reference_?.provider_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Split order payment is missing the cart payment it belongs to"
      )
    }

    const provider = this.container[reference_.provider_id] as
      | IPaymentProvider
      | undefined

    if (!provider) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payment provider ${reference_.provider_id} is not registered`
      )
    }

    return { provider, reference: reference_, data: providerData }
  }

  protected withReference(
    data: ProviderData,
    reference: SplitOrderPaymentReference
  ): Record<string, unknown> {
    return { ...data, [SPLIT_ORDER_PAYMENT_DATA_KEY]: reference }
  }

  async initiatePayment({
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    return { id: data?.session_id as string, data }
  }

  async authorizePayment({
    data,
  }: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { reference } = this.resolveTarget(data)

    return {
      data,
      status: reference.captured
        ? PaymentSessionStatus.CAPTURED
        : PaymentSessionStatus.AUTHORIZED,
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const { provider, reference, data } = this.resolveTarget(input.data)
    const result = await provider.capturePayment({ ...input, data })

    return { data: this.withReference(result.data ?? data, reference) }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { provider, reference, data } = this.resolveTarget(input.data)
    const result = await provider.refundPayment({ ...input, data })

    return { data: this.withReference(result.data ?? data, reference) }
  }

  async cancelPayment({
    data,
  }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data }
  }

  async deletePayment({
    data,
  }: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data }
  }

  async updatePayment({
    data,
  }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const { provider, reference, data } = this.resolveTarget(input.data)
    const result = await provider.retrievePayment({ ...input, data })

    return { data: this.withReference(result.data ?? data, reference) }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const { provider, reference, data } = this.resolveTarget(input.data)
    const result = await provider.getPaymentStatus({ ...input, data })

    return {
      ...result,
      data: this.withReference(result.data ?? data, reference),
    }
  }

  async getWebhookActionAndData(): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}
