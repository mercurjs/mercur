import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { DataGrid } from "@components/data-grid"
import { RouteFocusModal, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useBatchPriceListPrices } from "@hooks/api/price-lists"
import { castNumber } from "@lib/cast-number"
import {
  PriceListGridRow,
  usePriceListGridColumns,
} from "@pages/price-lists/common/hooks/use-price-list-grid-columns"
import { PriceListUpdateOffersSchema } from "@pages/price-lists/common/schemas"

type PriceListPricesEditFormProps = {
  priceList: HttpTypes.AdminPriceList
  gridData: PriceListGridRow[]
  variantIdByOffer: Record<string, string>
  regions: HttpTypes.AdminRegion[]
  currencies: string[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

const PricingOfferPricesSchema = z.object({
  offers: PriceListUpdateOffersSchema,
})

export const PriceListPricesEditForm = ({
  priceList,
  gridData,
  variantIdByOffer,
  regions,
  currencies,
  pricePreferences,
}: PriceListPricesEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()

  const initialValue = useRef(initRecord(priceList, variantIdByOffer))

  const form = useForm<z.infer<typeof PricingOfferPricesSchema>>({
    defaultValues: {
      offers: initialValue.current,
    },
    resolver: zodResolver(PricingOfferPricesSchema),
  })

  const { mutateAsync, isPending } = useBatchPriceListPrices(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const { pricesToDelete, pricesToCreate, pricesToUpdate } = sortPrices(
      values.offers,
      initialValue.current,
      regions,
      variantIdByOffer
    )

    mutateAsync(
      {
        delete: pricesToDelete,
        update: pricesToUpdate,
        create: pricesToCreate,
      },
      {
        onSuccess: () => {
          toast.success(t("priceLists.products.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const columns = usePriceListGridColumns({
    currencies,
    regions,
    pricePreferences,
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <DataGrid
            columns={columns}
            data={gridData}
            state={form}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function initRecord(
  priceList: HttpTypes.AdminPriceList,
  variantIdByOffer: Record<string, string> = {}
): PriceListUpdateOffersSchema {
  const record: PriceListUpdateOffersSchema = {}

  // Seed every offer shown in the grid with its variant_id, so editing a
  // variant that had no price yet still yields a valid offer entry
  // (variant_id is required by the schema).
  for (const [offerId, variantId] of Object.entries(variantIdByOffer)) {
    record[offerId] = {
      variant_id: variantId,
      currency_prices: {},
      region_prices: {},
    }
  }

  for (const price of priceList.prices ?? []) {
    const offerId = (price as { rules?: Record<string, string> }).rules
      ?.offer_id
    const variantId = (price as { variant_id?: string }).variant_id
    if (!offerId || !variantId) {
      continue
    }

    const entry = (record[offerId] ??= {
      variant_id: variantId,
      currency_prices: {},
      region_prices: {},
    })

    const regionId = (price as { rules?: Record<string, string> }).rules
      ?.region_id
    if (regionId) {
      entry.region_prices[regionId] = {
        amount: price.amount.toString(),
        id: price.id,
      }
    } else {
      entry.currency_prices[price.currency_code] = {
        amount: price.amount.toString(),
        id: price.id,
      }
    }
  }

  return record
}

type PriceObject = {
  offerId: string
  variantId: string
  currencyCode: string
  regionId?: string
  amount: number
  id?: string | null
}

function convertToPriceArray(
  data: PriceListUpdateOffersSchema,
  regions: HttpTypes.AdminRegion[]
) {
  const prices: PriceObject[] = []

  const regionCurrencyMap = regions.reduce(
    (map, region) => {
      map[region.id] = region.currency_code
      return map
    },
    {} as Record<string, string>
  )

  for (const [offerId, offer] of Object.entries(data || {})) {
    const { variant_id, currency_prices, region_prices } = offer || {}

    for (const [currencyCode, price] of Object.entries(currency_prices || {})) {
      if (price?.amount !== "" && typeof price?.amount !== "undefined") {
        prices.push({
          offerId,
          variantId: variant_id,
          currencyCode,
          amount: castNumber(price.amount),
          id: price.id,
        })
      }
    }

    for (const [regionId, price] of Object.entries(region_prices || {})) {
      if (price?.amount !== "" && typeof price?.amount !== "undefined") {
        prices.push({
          offerId,
          variantId: variant_id,
          regionId,
          currencyCode: regionCurrencyMap[regionId],
          amount: castNumber(price.amount),
          id: price.id,
        })
      }
    }
  }

  return prices
}

function createMapKey(obj: PriceObject) {
  return `${obj.offerId}-${obj.currencyCode}-${obj.regionId || "none"}-${
    obj.id || "none"
  }`
}

function buildRules(price: PriceObject) {
  return {
    offer_id: price.offerId,
    ...(price.regionId ? { region_id: price.regionId } : {}),
  }
}

function comparePrices(initialPrices: PriceObject[], newPrices: PriceObject[]) {
  const pricesToUpdate: HttpTypes.AdminUpdatePriceListPrice[] = []
  const pricesToCreate: HttpTypes.AdminCreatePriceListPrice[] = []
  const pricesToDelete: string[] = []

  const initialPriceMap = initialPrices.reduce(
    (map, price) => {
      map[createMapKey(price)] = price
      return map
    },
    {} as Record<string, PriceObject>
  )

  const newPriceMap = newPrices.reduce(
    (map, price) => {
      map[createMapKey(price)] = price
      return map
    },
    {} as Record<string, PriceObject>
  )

  const keys = new Set([
    ...Object.keys(initialPriceMap),
    ...Object.keys(newPriceMap),
  ])

  for (const key of keys) {
    const initialPrice = initialPriceMap[key]
    const newPrice = newPriceMap[key]

    if (initialPrice && newPrice) {
      if (isNaN(newPrice.amount) && newPrice.id) {
        pricesToDelete.push(newPrice.id)
      }

      if (initialPrice.amount !== newPrice.amount && newPrice.id) {
        pricesToUpdate.push({
          id: newPrice.id,
          variant_id: newPrice.variantId,
          currency_code: newPrice.currencyCode,
          rules: buildRules(newPrice),
          amount: newPrice.amount,
        })
      }
    }

    if (!initialPrice && newPrice) {
      pricesToCreate.push({
        variant_id: newPrice.variantId,
        currency_code: newPrice.currencyCode,
        rules: buildRules(newPrice),
        amount: newPrice.amount,
      })
    }

    if (initialPrice && !newPrice && initialPrice.id) {
      pricesToDelete.push(initialPrice.id)
    }
  }

  return { pricesToDelete, pricesToCreate, pricesToUpdate }
}

function sortPrices(
  data: PriceListUpdateOffersSchema,
  initialValue: PriceListUpdateOffersSchema,
  regions: HttpTypes.AdminRegion[],
  _variantIdByOffer: Record<string, string>
) {
  const initialPrices = convertToPriceArray(initialValue, regions)
  const newPrices = convertToPriceArray(data, regions)

  return comparePrices(initialPrices, newPrices)
}
