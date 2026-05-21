import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash } from "@medusajs/icons"
import {
  Button,
  IconButton,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCurrencies } from "../../../../../hooks/api/currencies"
import { useUpdateOffer } from "../../../../../hooks/api/offers"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { OfferDetail } from "../../../common/types"
import { PricingFormSchema, PricingFormValues } from "./schema"

type PriceRowForDedupe = {
  currency_code: string
  region_id?: string | null
  customer_group_id?: string | null
  min_quantity?: number | null
  max_quantity?: number | null
}

const findDuplicatePriceIndexes = (rows: PriceRowForDedupe[]): number[] => {
  const seen = new Map<string, number>()
  const duplicates: number[] = []
  rows.forEach((row, idx) => {
    const key = [
      row.currency_code,
      row.region_id ?? "",
      row.customer_group_id ?? "",
      row.min_quantity ?? "",
      row.max_quantity ?? "",
    ].join("|")
    if (seen.has(key)) {
      duplicates.push(idx)
    } else {
      seen.set(key, idx)
    }
  })
  return duplicates
}

type Props = { offer: OfferDetail }

const extractRule = (
  rules: { attribute?: string | null; value?: string | null }[] | null | undefined,
  attribute: string,
): string | null => {
  const found = rules?.find((r) => r.attribute === attribute)
  return found?.value ?? null
}

const buildDefaults = (offer: OfferDetail): PricingFormValues => {
  const prices = offer.price_set?.prices ?? []
  return {
    prices: prices.length > 0
      ? prices.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency_code: p.currency_code,
          region_id: extractRule(p.price_rules, "region_id"),
          customer_group_id: extractRule(p.price_rules, "customer_group_id"),
          min_quantity: p.min_quantity ?? null,
          max_quantity: p.max_quantity ?? null,
        }))
      : [
          {
            amount: 0,
            currency_code: "",
            region_id: null,
            customer_group_id: null,
            min_quantity: null,
            max_quantity: null,
          },
        ],
  }
}

export const PricingForm = ({ offer }: Props) => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const { handleSuccess } = useRouteModal()
  const { currencies } = useCurrencies({ limit: 1000 })

  const form = useForm<PricingFormValues>({
    defaultValues: buildDefaults(offer),
    resolver: zodResolver(PricingFormSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "prices",
  })

  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const duplicates = findDuplicatePriceIndexes(values.prices)
    if (duplicates.length > 0) {
      duplicates.forEach((idx) => {
        form.setError(`prices.${idx}.currency_code` as const, {
          type: "manual",
          message: t("offers.validation.duplicatePriceRule"),
        })
      })
      return
    }

    const prices = values.prices.map((p) => {
      const rules: Record<string, string> = {}
      if (p.region_id) rules.region_id = p.region_id
      if (p.customer_group_id) rules.customer_group_id = p.customer_group_id
      return {
        ...(p.id ? { id: p.id } : {}),
        amount: Number(p.amount),
        currency_code: p.currency_code,
        min_quantity: p.min_quantity ?? undefined,
        max_quantity: p.max_quantity ?? undefined,
        rules: Object.keys(rules).length > 0 ? rules : undefined,
      }
    })

    await mutateAsync(
      { prices },
      {
        onSuccess: () => {
          toast.success(t("offers.pricing.successToast"))
          handleSuccess()
        },
        onError: (e) => toast.error(e.message),
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="offer-pricing-edit-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          {fields.map((field, index) => (
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
                        <Select {...f} onValueChange={onChange} dir={dir}>
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
          ))}

          <div>
            <Button
              size="small"
              variant="transparent"
              type="button"
              onClick={() =>
                append({
                  amount: 0,
                  currency_code: currencies?.[0]?.code ?? "",
                  region_id: null,
                  customer_group_id: null,
                  min_quantity: null,
                  max_quantity: null,
                })
              }
            >
              <Plus />
              <Text size="small">{t("offers.create.addPrice")}</Text>
            </Button>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
