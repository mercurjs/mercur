import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { DataGrid } from "@components/data-grid"
import {
  RouteFocusModal,
  StackedFocusModal,
  useRouteModal,
  useStackedModal,
} from "@components/modals/index"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { usePricePreferences } from "@hooks/api/price-preferences"
import { useUpdateShippingOptions } from "@hooks/api/shipping-options"
import { useStoreCurrencies } from "@hooks/api/use-store-currencies"
import { castNumber } from "@lib/cast-number"
import { ConditionalPriceForm } from "@pages/settings/locations/_common/components/conditional-price-form"
import { ShippingOptionPriceProvider } from "@pages/settings/locations/_common/components/shipping-option-price-provider"
import {
  CONDITIONAL_PRICES_STACKED_MODAL_ID,
  ITEM_TOTAL_ATTRIBUTE,
  REGION_ID_ATTRIBUTE,
} from "@pages/settings/locations/_common/constants"
import { useShippingOptionPriceColumns } from "@pages/settings/locations/_common/hooks/use-shipping-option-price-columns"
import {
  UpdateConditionalPrice,
  UpdateConditionalPriceSchema,
} from "@pages/settings/locations/_common/schema"
import { ConditionalPriceInfo } from "@pages/settings/locations/_common/types"
import { useRegions } from "@hooks/api"

type PriceRecord = {
  id?: string
  currency_code?: string
  region_id?: string
  amount: number
}

const EditShippingOptionPricingSchema = zod.object({
  region_prices: zod.record(
    zod.string(),
    zod.string().or(zod.number()).optional()
  ),
  currency_prices: zod.record(
    zod.string(),
    zod.string().or(zod.number()).optional()
  ),
  conditional_region_prices: zod.record(
    zod.string(),
    zod.array(UpdateConditionalPriceSchema)
  ),
  conditional_currency_prices: zod.record(
    zod.string(),
    zod.array(UpdateConditionalPriceSchema)
  ),
})

type EditShippingOptionPricingFormProps = {
  shippingOption: HttpTypes.AdminShippingOption
}

export function EditShippingOptionsPricingForm({
  shippingOption,
}: EditShippingOptionPricingFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { getIsOpen, setIsOpen } = useStackedModal()
  const [selectedPrice, setSelectedPrice] =
    useState<ConditionalPriceInfo | null>(null)

  const onOpenConditionalPricesModal = (info: ConditionalPriceInfo) => {
    setIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID, true)
    setSelectedPrice(info)
  }

  const onCloseConditionalPricesModal = () => {
    setIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID, false)
    setSelectedPrice(null)
  }

  const form = useForm<zod.infer<typeof EditShippingOptionPricingSchema>>({
    defaultValues: getDefaultValues(shippingOption.prices),
    resolver: zodResolver(EditShippingOptionPricingSchema),
  })

  const { mutateAsync, isPending } = useUpdateShippingOptions(shippingOption.id)

  const { currencies: storeCurrencies, isPending: isStoreLoading } = useStoreCurrencies()

  const currencies = useMemo(
    () => storeCurrencies?.map((c) => c.currency_code) || [],
    [storeCurrencies]
  )

  const { price_preferences: pricePreferences } = usePricePreferences({})

  const { regions } = useRegions({
    fields: "id,name,currency_code",
    limit: 999,
  })

  const { setCloseOnEscape } = useRouteModal()

  const columns = useShippingOptionPriceColumns({
    name: shippingOption.name,
    currencies,
    regions,
    pricePreferences,
  })

  const data = useMemo(() => [[...(currencies || [])]], [currencies])

  const handleSubmit = form.handleSubmit(async (data) => {
    // const currencyPrices = Object.entries(data.currency_prices)
    //   .map(([code, value]) => {
    //     if (
    //       !value ||
    //       !currencies.some((c) => c.toLowerCase() === code.toLowerCase())
    //     ) {
    //       return undefined
    //     }

    //     const priceRecord: PriceRecord = {
    //       currency_code: code,
    //       amount: castNumber(value),
    //     }

    //     const existingPrice = shippingOption.prices.find(
    //       (p) => p.currency_code === code && !p.price_rules!.length
    //     )

    //     if (existingPrice) {
    //       priceRecord.id = existingPrice.id
    //     }

    //     return priceRecord
    //   })
    //   .filter((p): p is PriceRecord => !!p)

    // const conditionalCurrencyPrices = Object.entries(
    //   data.conditional_currency_prices
    // ).flatMap(([currency_code, value]) =>
    //   value?.map((rule) => ({
    //     id: rule.id,
    //     currency_code,
    //     amount: castNumber(rule.amount),
    //     rules: buildShippingOptionPriceRules(rule),
    //   }))
    // )

    /**
     * TODO: If we try to update an existing region price the API throws an error.
     * Instead we re-create region prices.
     */
    const regionPrices = Object.entries(data.region_prices)
      .map(([region_id, value]) => {
        const priceRecord: PriceRecord = {
          region_id,
          amount: castNumber(value || 0),
          // currency_code: regions?.find((r) => r.id === region_id)
          //   ?.currency_code,
        }

        return priceRecord
      })
      .filter((p): p is PriceRecord => !!p)

    // const conditionalRegionPrices = Object.entries(
    //   data.conditional_region_prices
    // ).flatMap(([region_id, value]) =>
    //   value?.map((rule) => ({
    //     id: rule.id,
    //     region_id,
    //     amount: castNumber(rule.amount),
    //     rules: buildShippingOptionPriceRules(rule),
    //   }))
    // )

    const allPrices = [
      // ...currencyPrices,
      // ...conditionalCurrencyPrices,
      ...regionPrices,
      // ...conditionalRegionPrices,
    ]

    await mutateAsync(
      { prices: allPrices },
      {
        onSuccess: () => {
          toast.success(t("general.success"))
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  const isLoading = isStoreLoading || !storeCurrencies

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body>
          <StackedFocusModal
            id={CONDITIONAL_PRICES_STACKED_MODAL_ID}
            onOpenChangeCallback={(open) => {
              if (!open) {
                setSelectedPrice(null)
              }
            }}
          >
            <ShippingOptionPriceProvider
              onOpenConditionalPricesModal={onOpenConditionalPricesModal}
              onCloseConditionalPricesModal={onCloseConditionalPricesModal}
            >
              <div className="flex size-full flex-col divide-y overflow-hidden">
                <DataGrid
                  isLoading={isLoading}
                  data={data}
                  columns={columns}
                  state={form}
                  onEditingChange={(editing) => setCloseOnEscape(!editing)}
                  disableInteractions={getIsOpen(
                    CONDITIONAL_PRICES_STACKED_MODAL_ID
                  )}
                />
              </div>
              {selectedPrice && (
                <ConditionalPriceForm info={selectedPrice} variant="update" />
              )}
            </ShippingOptionPriceProvider>
          </StackedFocusModal>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              className="whitespace-nowrap"
              isLoading={isPending}
              onClick={handleSubmit}
              type="button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const findRuleValue = (
  rules: HttpTypes.AdminShippingOptionPriceRule[],
  operator: string
) => {
  const fallbackValue = ["eq", "gt", "lt"].includes(operator) ? undefined : null

  return (
    rules?.find(
      (r) => r.attribute === ITEM_TOTAL_ATTRIBUTE && r.operator === operator
    )?.value || fallbackValue
  )
}

const mapToConditionalPrice = (
  price: HttpTypes.AdminShippingOptionPrice
): UpdateConditionalPrice => {
  const rules = price.price_rules || []

  return {
    id: price.id,
    amount: price.amount,
    gte: findRuleValue(rules, "gte"),
    lte: findRuleValue(rules, "lte"),
    gt: findRuleValue(rules, "gt") as undefined | null,
    lt: findRuleValue(rules, "lt") as undefined | null,
    eq: findRuleValue(rules, "eq") as undefined | null,
  }
}

const getDefaultValues = (prices: HttpTypes.AdminShippingOptionPrice[]) => {
  const hasAttributes = (
    price: HttpTypes.AdminShippingOptionPrice,
    required: string[],
    forbidden: string[] = []
  ) => {
    const attributes = price.price_rules?.map((r) => r.attribute) || []
    return (
      required.every((attr) => attributes.includes(attr)) &&
      !forbidden.some((attr) => attributes.includes(attr))
    )
  }

  const currency_prices: Record<string, number> = {}
  const conditional_currency_prices: Record<string, UpdateConditionalPrice[]> =
    {}
  const region_prices: Record<string, number> = {}
  const conditional_region_prices: Record<string, UpdateConditionalPrice[]> = {}

  prices.forEach((price) => {
    if (!price.price_rules?.length) {
      currency_prices[price.currency_code!] = price.amount
      return
    }

    const region_id = price.price_rules?.find(
      (r) => r.attribute === REGION_ID_ATTRIBUTE
    )?.value

    if (region_id) {
      region_prices[region_id] = price.amount
      return
    }

    if (hasAttributes(price, [ITEM_TOTAL_ATTRIBUTE], [REGION_ID_ATTRIBUTE])) {
      const code = price.currency_code!
      if (!conditional_currency_prices[code]) {
        conditional_currency_prices[code] = []
      }
      conditional_currency_prices[code].push(mapToConditionalPrice(price))
      return
    }
  })

  return {
    currency_prices,
    conditional_currency_prices,
    region_prices,
    conditional_region_prices,
  }
}
