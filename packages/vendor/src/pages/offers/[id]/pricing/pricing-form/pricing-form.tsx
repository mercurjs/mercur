import { zodResolver } from "@hookform/resolvers/zod"
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
import { useCurrentSeller } from "../../../../../hooks/api/sellers"
import { OfferDetail, OfferPrice } from "../../../common/types"
import {
  PricingFormSchema,
  PricingFormValues,
  PricingRow,
} from "./schema"

type Props = {
  offer: OfferDetail
}

const hasRules = (price: OfferPrice) => (price.rules_count ?? 0) > 0

const buildDefaults = (
  offer: OfferDetail,
  currencies: string[],
): PricingFormValues => {
  const basePrice: PricingRow = {
    id: offer.id,
    currency_prices: currencies.reduce<Record<string, number | "">>(
      (acc, code) => {
        const existing = offer.price_set?.prices?.find(
          (p) => !hasRules(p) && p.currency_code === code,
        )
        acc[code] = existing?.amount ?? ""
        return acc
      },
      {},
    ),
  }

  return { prices: [basePrice] }
}

export const PricingForm = ({ offer }: Props) => {
  const { currency_code, isPending: isSellerPending } = useCurrentSeller()

  const currencies = useMemo(
    () => (currency_code ? [currency_code] : []),
    [currency_code],
  )

  if (isSellerPending || !currencies.length) return null

  return <PricingFormInner offer={offer} currencies={currencies} />
}

const PricingFormInner = ({
  offer,
  currencies,
}: {
  offer: OfferDetail
  currencies: string[]
}) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const { price_preferences: pricePreferences } = usePricePreferences({})

  const defaults = useMemo(
    () => buildDefaults(offer, currencies),
    [offer, currencies],
  )

  const form = useForm<PricingFormValues>({
    defaultValues: defaults,
    resolver: zodResolver(PricingFormSchema),
  })

  const columns = usePriceGridColumns({
    currencies,
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
    const submitted: { amount: number; currency_code: string }[] = []
    for (const [currency_code, amount] of Object.entries(
      row.currency_prices ?? {},
    )) {
      if (amount === "" || amount === undefined || amount === null) continue
      const num = Number(amount)
      if (!Number.isFinite(num)) continue
      submitted.push({ amount: num, currency_code })
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
  pricePreferences = [],
}: {
  currencies?: string[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
}) => {
  const { t } = useTranslation()

  return useMemo(() => {
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
        getFieldName: (context, value) => {
          if (context.column.id?.startsWith("currency_prices")) {
            return `prices.${context.row.index}.currency_prices.${value}`
          }
          return null
        },
        t,
      }),
    ]
  }, [t, currencies, pricePreferences])
}
