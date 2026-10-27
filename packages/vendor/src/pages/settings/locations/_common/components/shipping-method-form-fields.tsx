import { CurrencyInput, Input, Text } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "@components/common/form"
import { getCurrencySymbol } from "@lib/data/currencies"

import { ShippingPriceRow } from "../shipping-methods"

const wholeDays = z
  .string()
  .regex(/^\d*$/)
  .optional()

export const ShippingMethodFormSchema = z.object({
  prices: z.record(z.string(), z.string().optional()),
  transit_min_days: wholeDays,
  transit_max_days: wholeDays,
})

export type ShippingMethodFormValues = z.infer<typeof ShippingMethodFormSchema>

export const toFormAmount = (amount: number | null | undefined) =>
  amount === null || amount === undefined ? "" : String(amount)

export const toFormDays = (days: number | null | undefined) =>
  days === null || days === undefined ? "" : String(days)

export const parseDays = (value?: string) =>
  value === undefined || value === "" ? null : Number(value)

export const collectAmounts = (
  form: UseFormReturn<ShippingMethodFormValues>,
  rows: ShippingPriceRow[],
  values: ShippingMethodFormValues,
  requiredMessage: string
) => {
  const amounts: Record<string, number> = {}
  let valid = true

  for (const row of rows) {
    const raw = values.prices[row.key]
    const amount = raw === undefined || raw === "" ? NaN : Number(raw)

    if (!Number.isFinite(amount) || amount < 0) {
      form.setError(`prices.${row.key}`, {
        type: "manual",
        message: requiredMessage,
      })
      valid = false
      continue
    }

    amounts[row.key] = amount
  }

  return valid ? amounts : null
}

export const validateTransitRange = (
  form: UseFormReturn<ShippingMethodFormValues>,
  values: ShippingMethodFormValues,
  message: string
) => {
  const min = parseDays(values.transit_min_days)
  const max = parseDays(values.transit_max_days)

  if (min !== null && max !== null && min > max) {
    form.setError("transit_min_days", { type: "manual", message })
    return false
  }

  return true
}

type ShippingMethodFormFieldsProps = {
  form: UseFormReturn<ShippingMethodFormValues>
  rows: ShippingPriceRow[]
  showPrices: boolean
  canEditPrice: boolean
  showTransit: boolean
  canEditTransit: boolean
}

export const ShippingMethodFormFields = ({
  form,
  rows,
  showPrices,
  canEditPrice,
  showTransit,
  canEditTransit,
}: ShippingMethodFormFieldsProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-8">
      {showPrices && rows.length > 0 && (
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col">
            <Text size="small" weight="plus" leading="compact">
              {t("shippingMethods.fields.prices")}
            </Text>
            {!canEditPrice && (
              <Text size="small" className="text-ui-fg-subtle">
                {t("shippingMethods.setByMarketplace")}
              </Text>
            )}
          </div>
          {rows.map((row) => (
            <Form.Field
              key={row.key}
              control={form.control}
              name={`prices.${row.key}`}
              render={({ field: { onChange, value, ...field } }) => (
                <Form.Item>
                  <Form.Label>{row.label}</Form.Label>
                  <Form.Control>
                    <CurrencyInput
                      {...field}
                      min={0}
                      code={row.currency_code}
                      symbol={
                        row.currency_code
                          ? getCurrencySymbol(row.currency_code)
                          : ""
                      }
                      value={value ?? ""}
                      disabled={!canEditPrice}
                      onValueChange={(next) => onChange(next ?? "")}
                      data-testid={`shipping-method-form-price-${row.key}`}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          ))}
        </div>
      )}

      {showTransit && (
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col">
            <Text size="small" weight="plus" leading="compact">
              {t("shippingMethods.fields.transit")}
            </Text>
            {!canEditTransit && (
              <Text size="small" className="text-ui-fg-subtle">
                {t("shippingMethods.setByMarketplace")}
              </Text>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Field
              control={form.control}
              name="transit_min_days"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("shippingMethods.fields.transitMinDays")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={1}
                      value={field.value ?? ""}
                      disabled={!canEditTransit}
                      data-testid="shipping-method-form-transit-min-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="transit_max_days"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("shippingMethods.fields.transitMaxDays")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={1}
                      value={field.value ?? ""}
                      disabled={!canEditTransit}
                      data-testid="shipping-method-form-transit-max-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}
