import { zodResolver } from "@hookform/resolvers/zod"
import { useCan } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateOffer } from "../../../../../hooks/api/offers"
import { usePricePreferences } from "../../../../../hooks/api/price-preferences"
import { useRegions } from "../../../../../hooks/api/regions"
import { useCurrentSeller } from "../../../../../hooks/api/sellers"
import { castNumber } from "../../../../../lib/cast-number"
import { isBasePrice, isRegionPrice } from "../../../common/region-prices"
import { OfferDetail } from "../../../common/types"
import {
  PricingFormSchema,
  PricingFormValues,
  PricingRow,
} from "./schema"

type Props = {
  offer: OfferDetail
}

type Region = HttpTypes.AdminRegion

const buildDefaults = (
  offer: OfferDetail,
  currencies: string[],
  regions: Region[],
): PricingFormValues => {
  const basePrice: PricingRow = {
    id: offer.id,
    currency_prices: currencies.reduce<Record<string, number | "">>(
      (acc, code) => {
        const existing = offer.prices?.find(
          (p) => isBasePrice(p) && p.currency_code === code,
        )
        acc[code] = existing?.amount ?? ""
        return acc
      },
      {},
    ),
    region_prices: regions.reduce<Record<string, number | "">>(
      (acc, region) => {
        const existing = offer.prices?.find((p) => isRegionPrice(p, region.id))
        acc[region.id] = existing?.amount ?? ""
        return acc
      },
      {},
    ),
  }

  return { prices: [basePrice] }
}

export const PricingForm = ({ offer }: Props) => {
  const { currency_code, isPending: isSellerPending } = useCurrentSeller()
  const canViewRegions = useCan("regions")
  const { regions, isPending: isRegionsPending } = useRegions(
    { fields: "id,name,currency_code", limit: 999 },
    { enabled: canViewRegions },
  )

  const sellerCurrencies = useMemo(
    () => (currency_code ? [currency_code] : []),
    [currency_code],
  )

  const resolvedRegions = useMemo(
    () => (canViewRegions ? (regions ?? []) : []),
    [canViewRegions, regions],
  )

  if (isSellerPending || !sellerCurrencies.length) return null
  if (canViewRegions && isRegionsPending) return null

  return (
    <PricingFormInner
      offer={offer}
      currencies={sellerCurrencies}
      regions={resolvedRegions}
    />
  )
}

const PricingFormInner = ({
  offer,
  currencies,
  regions,
}: {
  offer: OfferDetail
  currencies: string[]
  regions: Region[]
}) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const canViewPricePreferences = useCan("price_preferences")
  const { price_preferences: pricePreferences } = usePricePreferences(
    {},
    { enabled: canViewPricePreferences }
  )

  const defaults = useMemo(
    () => buildDefaults(offer, currencies, regions),
    [offer, currencies, regions],
  )

  const form = useForm<PricingFormValues>({
    defaultValues: defaults,
    resolver: zodResolver(PricingFormSchema),
  })

  const columns = usePriceGridColumns({
    currencies,
    regions,
    pricePreferences,
  })

  const prices = useWatch({
    control: form.control,
    name: "prices",
    defaultValue: defaults.prices,
  }) as PricingRow[]

  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const row = values.prices[0]
    const submitted: {
      id?: string
      amount: number
      currency_code: string
      rules?: Record<string, string>
    }[] = []
    for (const [currency_code, amount] of Object.entries(
      row.currency_prices ?? {},
    )) {
      if (amount === "" || amount === undefined || amount === null) continue
      const num = castNumber(amount)
      if (!Number.isFinite(num)) continue
      const existing = offer.prices?.find(
        (p) => isBasePrice(p) && p.currency_code === currency_code,
      )
      submitted.push({
        ...(existing?.id ? { id: existing.id } : {}),
        amount: num,
        currency_code,
      })
    }
    for (const [regionId, amount] of Object.entries(row.region_prices ?? {})) {
      if (amount === "" || amount === undefined || amount === null) continue
      const region = regions.find((r) => r.id === regionId)
      if (!region) continue
      const num = castNumber(amount)
      if (!Number.isFinite(num)) continue
      const existing = offer.prices?.find((p) => isRegionPrice(p, regionId))
      submitted.push({
        ...(existing?.id ? { id: existing.id } : {}),
        amount: num,
        currency_code: region.currency_code,
        rules: { region_id: regionId },
      })
    }

    await mutateAsync(
      { prices: submitted },
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
    <RouteFocusModal.Form form={form} data-testid="offer-pricing-edit-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <DataGrid
            state={form}
            columns={columns}
            data={prices}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const columnHelper = createDataGridHelper<PricingRow, PricingFormValues>()

const usePriceGridColumns = ({
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  currencies?: string[]
  regions?: Region[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
}) => {
  const { t } = useTranslation()

  return useMemo(() => {
    const cellCurrencies = Array.from(
      new Set([...currencies, ...regions.map((r) => r.currency_code)]),
    )

    return [
      columnHelper.column({
        id: "title",
        name: t("fields.title"),
        header: t("fields.title"),
        cell: (context) => (
          <DataGrid.ReadonlyCell context={context}>
            <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
              <span className="truncate">{t("labels.prices")}</span>
            </div>
          </DataGrid.ReadonlyCell>
        ),
        disableHiding: true,
      }),
      ...createDataGridPriceColumns<PricingRow, PricingFormValues>({
        currencies,
        pricePreferences,
        getFieldName: (context, value) =>
          `prices.${context.row.index}.currency_prices.${value}`,
        t,
      }),
      ...createDataGridPriceColumns<PricingRow, PricingFormValues>({
        currencies: cellCurrencies,
        regions,
        pricePreferences,
        getFieldName: (context, value) =>
          `prices.${context.row.index}.region_prices.${value}`,
        t,
      }).filter((column) => column.id?.startsWith("region_prices")),
    ]
  }, [t, currencies, regions, pricePreferences])
}
