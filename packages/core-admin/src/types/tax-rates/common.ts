import type { HttpTypes } from "@medusajs/types";

export interface ExtendedAdminTaxRateRule extends HttpTypes.AdminTaxRateRule {
    created_at?: string;
}

export interface ExtendedAdminTaxRate extends HttpTypes.AdminTaxRate {
    rules: ExtendedAdminTaxRateRule[];
}

export interface ExtendedAdminTaxRateResponse {
    tax_rate: ExtendedAdminTaxRate;
}