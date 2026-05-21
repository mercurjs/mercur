import { Input, Select, Switch, Text } from "@medusajs/ui"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../../components/common/thumbnail"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useShippingProfiles } from "../../../../hooks/api/shipping-profiles"
import { useStockLocations } from "../../../../hooks/api/stock-locations"
import { useStore } from "../../../../hooks/api/store"
import {
  CreateOfferFormValues,
  VariantSnapshot,
} from "./schema"

type LocationLite = {
  id: string
  name?: string | null
}

type CurrencyLite = {
  currency_code: string
}

const Root = () => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()
  const selectedVariants =
    (form.watch("selected_variants") ?? []) as VariantSnapshot[]
  const { stock_locations } = useStockLocations({ limit: 100 }) as {
    stock_locations?: LocationLite[]
  }
  const { store } = useStore({ fields: "+supported_currencies" })
  const { shipping_profiles } = useShippingProfiles({ limit: 100 })

  const locations: LocationLite[] = stock_locations ?? []
  const currencies: CurrencyLite[] =
    (store?.supported_currencies as CurrencyLite[] | undefined) ?? []

  const groupedMap = new Map<
    string,
    { product: VariantSnapshot; variants: VariantSnapshot[] }
  >()
  for (const v of selectedVariants) {
    const key = v.product_id || v.variant_id
    if (!groupedMap.has(key)) {
      groupedMap.set(key, { product: v, variants: [] })
    }
    groupedMap.get(key)!.variants.push(v)
  }
  const grouped = Array.from(groupedMap.values())

  return (
    <div className="flex flex-col p-6 gap-y-4" data-testid="offer-create-tab-stockLevelsAndPrices">
      <div className="flex items-center justify-between gap-x-2">
        <Text size="small" weight="plus">
          {t("offers.create.tabs.stockLevelsAndPrices")}
        </Text>
        <div className="w-72">
          <Controller
            control={form.control}
            name="shipping_profile_id"
            render={({ field: { ref, onChange, ...field } }) => (
              <Select {...field} onValueChange={onChange}>
                <Select.Trigger ref={ref} data-testid="offer-create-shipping-profile">
                  <Select.Value
                    placeholder={t("offers.fields.shippingProfile")}
                  />
                </Select.Trigger>
                <Select.Content>
                  {(shipping_profiles ?? []).map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                      {p.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ui-bg-subtle text-ui-fg-subtle border-b">
            <tr>
              <th className="px-4 py-3 font-medium">{t("fields.title")}</th>
              <th className="px-4 py-3 font-medium">{t("offers.fields.sku")}</th>
              {locations.map((loc) => (
                <th
                  key={loc.id}
                  className="px-4 py-3 font-medium whitespace-nowrap"
                >
                  {t("offers.fields.stockLocation", { name: loc.name ?? loc.id })}
                </th>
              ))}
              {currencies.map((c) => (
                <th
                  key={c.currency_code}
                  className="px-4 py-3 font-medium whitespace-nowrap"
                >
                  {t("offers.fields.priceCurrency", {
                    code: c.currency_code.toUpperCase(),
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {grouped.length === 0 && (
              <tr>
                <td
                  colSpan={2 + locations.length + currencies.length}
                  className="px-4 py-6 text-center"
                >
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("offers.validation.selectAtLeastOneVariant")}
                  </Text>
                </td>
              </tr>
            )}
            {grouped.map((group) => (
              <Fragment key={group.product.product_id} group={group}>
                <tr className="bg-ui-bg-subtle">
                  <td
                    colSpan={2 + locations.length + currencies.length}
                    className="px-4 py-2"
                  >
                    <div className="flex items-center gap-x-2">
                      <Thumbnail src={group.product.product_thumbnail ?? null} />
                      <Text size="small" weight="plus">
                        {group.product.product_title}
                      </Text>
                    </div>
                  </td>
                </tr>
                {group.variants.map((variant) => (
                  <VariantRow
                    key={variant.variant_id}
                    variant={variant}
                    locations={locations}
                    currencies={currencies}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Fragment = ({ children }: { children: React.ReactNode; group: unknown }) => <>{children}</>

const VariantRow = ({
  variant,
  locations,
  currencies,
}: {
  variant: VariantSnapshot
  locations: LocationLite[]
  currencies: CurrencyLite[]
}) => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()
  const rowName = `rows.${variant.variant_id}` as const

  const error = form.formState.errors?.rows?.[variant.variant_id] as
    | { sku?: { message?: string } }
    | undefined

  return (
    <tr data-testid={`offer-create-stock-row-${variant.variant_id}`}>
      <td className="px-4 py-3 align-top">
        <Text size="small" weight="plus" leading="compact">
          {variant.variant_title}
        </Text>
      </td>
      <td className="px-4 py-3 align-top">
        <Controller
          control={form.control}
          name={`${rowName}.sku`}
          render={({ field }) => (
            <div className="flex flex-col gap-y-1">
              <Input
                placeholder={t("offers.fields.sku")}
                value={field.value ?? ""}
                onChange={field.onChange}
                data-testid={`offer-create-stock-row-${variant.variant_id}-sku-input`}
              />
              {error?.sku?.message && (
                <Text size="xsmall" className="text-ui-fg-error">
                  {error.sku.message}
                </Text>
              )}
            </div>
          )}
        />
      </td>
      {locations.map((loc) => (
        <td key={loc.id} className="px-4 py-3 align-top">
          <Controller
            control={form.control}
            name={`${rowName}.locations.${loc.id}`}
            render={({ field }) => (
              <div className="flex items-center gap-x-2">
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  data-testid={`offer-create-stock-row-${variant.variant_id}-location-${loc.id}-toggle`}
                />
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {field.value
                    ? t("offers.fields.enabled")
                    : t("offers.fields.notEnabled")}
                </Text>
              </div>
            )}
          />
        </td>
      ))}
      {currencies.map((c) => (
        <td key={c.currency_code} className="px-4 py-3 align-top">
          <Controller
            control={form.control}
            name={`${rowName}.prices.${c.currency_code}`}
            render={({ field }) => (
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                data-testid={`offer-create-stock-row-${variant.variant_id}-price-${c.currency_code}-input`}
              />
            )}
          />
        </td>
      ))}
    </tr>
  )
}

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "stockLevelsAndPrices",
  labelKey: "offers.create.tabs.stockLevelsAndPrices",
  validationFields: ["shipping_profile_id"],
})

export const CreateOfferStockLevelsAndPricesTab = Root
