import { CurrencyDTO } from "@medusajs/framework/types"
import { PaginatedResponse } from "./common"

export type VendorCurrency = CurrencyDTO

export type VendorCurrencyResponse = {
  currency: VendorCurrency
}

export type VendorCurrencyListResponse = PaginatedResponse<{
  currencies: VendorCurrency[]
}>
