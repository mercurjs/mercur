import {
  PaginatedResponse,
  PaymentDTO,
  PaymentProviderDTO,
} from "@medusajs/types"

export interface VendorPaymentResponse {
  /**
   * The payment's details.
   */
  payment: PaymentDTO
}

export type VendorPaymentListResponse = PaginatedResponse<{
  /**
   * The list of payments.
   */
  payments: PaymentDTO[]
}>

export type VendorPaymentProviderListResponse = PaginatedResponse<{
  /**
   * The list of payment providers.
   */
  payment_providers: PaymentProviderDTO[]
}>
