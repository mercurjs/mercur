import { Plus, Trash } from "@medusajs/icons"
import { Button, Heading, IconButton, Input, Select, Text } from "@medusajs/ui"
import { useEffect } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { useCurrencies } from "../../../../hooks/api/currencies"
import { useDocumentDirection } from "../../../../hooks/use-document-direction"
import { findDuplicatePriceIndexes } from "./schema"

export type PricesFieldArrayValues = {
  prices: {
    id?: string
    amount: number | string
    currency_code: string
    region_id?: string | null
    customer_group_id?: string | null
    min_quantity?: number | string | null
    max_quantity?: number | string | null
  }[]
}

export const PricesRepeater = () => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const form = useFormContext<PricesFieldArrayValues>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prices",
  })
  const { currencies } = useCurrencies({ limit: 1000 })

  const watchedPrices = form.watch("prices")
  const duplicates = findDuplicatePriceIndexes(
    (watchedPrices ?? []) as Parameters<typeof findDuplicatePriceIndexes>[0],
  )

  useEffect(() => {
    if (fields.length === 0) {
      append({
        amount: "",
        currency_code: currencies?.[0]?.code ?? "",
        region_id: null,
        customer_group_id: null,
        min_quantity: null,
        max_quantity: null,
      })
    }
  }, [fields.length, append, currencies])

  return (
    <div className="flex flex-col gap-y-3" data-testid="offer-create-prices-repeater">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h3">{t("offers.create.prices")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.create.pricesDescription")}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-y-3">
        {fields.map((field, index) => {
          const isDuplicate = duplicates.includes(index)
          return (
            <div
              key={field.id}
              className="bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name={`prices.${index}.amount`}
                  render={({ field: f }) => (
                    <Form.Item>
                      <Form.Label>{t("fields.price")}</Form.Label>
                      <Form.Control>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...f}
                          value={f.value ?? ""}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name={`prices.${index}.currency_code`}
                  render={({ field: { ref: _r, onChange, ...f } }) => (
                    <Form.Item>
                      <Form.Label>{t("fields.currency")}</Form.Label>
                      <Form.Control>
                        <Select
                          {...f}
                          onValueChange={onChange}
                          dir={dir}
                        >
                          <Select.Trigger ref={_r}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {(currencies ?? []).map((c) => (
                              <Select.Item key={c.code} value={c.code}>
                                {c.code.toUpperCase()} — {c.name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name={`prices.${index}.min_quantity`}
                  render={({ field: f }) => (
                    <Form.Item>
                      <Form.Label optional>
                        {t("offers.fields.minQuantity")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          type="number"
                          min="1"
                          {...f}
                          value={f.value ?? ""}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name={`prices.${index}.max_quantity`}
                  render={({ field: f }) => (
                    <Form.Item>
                      <Form.Label optional>
                        {t("offers.fields.maxQuantity")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          type="number"
                          min="1"
                          {...f}
                          value={f.value ?? ""}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              {isDuplicate && (
                <Text size="small" className="text-ui-fg-error mt-2">
                  {t("offers.validation.duplicatePriceRule")}
                </Text>
              )}

              {fields.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <IconButton
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() => remove(index)}
                  >
                    <Trash />
                  </IconButton>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div>
        <Button
          size="small"
          variant="transparent"
          type="button"
          onClick={() =>
            append({
              amount: "",
              currency_code: currencies?.[0]?.code ?? "",
              region_id: null,
              customer_group_id: null,
              min_quantity: null,
              max_quantity: null,
            })
          }
        >
          <Plus />
          {t("offers.create.addPrice")}
        </Button>
      </div>
    </div>
  )
}
