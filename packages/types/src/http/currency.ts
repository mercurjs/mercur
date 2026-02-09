import { CurrencyDTO, PaginatedResponse } from "@medusajs/types"

export type VendorCurrency = CurrencyDTO

export type VendorCurrencyResponse = {
  currency: VendorCurrency
}

export type VendorCurrencyListResponse = PaginatedResponse<{
  currencies: VendorCurrency[]
}>
