import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { Button, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { isForbidden, SectionNoAccess, useCan } from "@mercurjs/dashboard-shared"

import { Thumbnail } from "../../../../components/common/thumbnail"
import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../components/data-grid"
import { RouteFocusModal, useRouteModal } from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import { usePricePreferences } from "../../../../hooks/api/price-preferences"
import { useProduct, productsQueryKeys } from "../../../../hooks/api/products"
import { offerQueryKeys } from "../../../../hooks/api/offers"
import { castNumber } from "../../../../lib/cast-number"
import { sdk } from "../../../../lib/client"
import { queryClient } from "../../../../lib/query-client"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../../common/constants"
import { isBasePrice, isRegionPrice } from "../../common/region-prices"
import { useSellerCurrencies } from "../../common/use-seller-currencies"
import { OfferPrice } from "../../common/types"

type EditPriceRow = {
  offer_id: string
  variant_title: string
  product_thumbnail?: string | null
  prices: Record<string, number | string>
  region_prices: Record<string, number | string>
}

type Region = HttpTypes.AdminRegion

type FormValues = { rows: EditPriceRow[] }

type PriceProduct = HttpTypes.AdminProduct & {
  variants?: Array<
    HttpTypes.AdminProductVariant & { offers?: OfferDTO[] | null }
  > | null
}

const numericOrZero = (v: number | string | undefined | null): number =>
  v === "" || v === null || v === undefined ? 0 : castNumber(v) || 0

const buildRows = (
  product: PriceProduct,
  currencies: string[],
  regions: Region[],
): EditPriceRow[] =>
  (product.variants ?? []).flatMap((variant) =>
    (variant.offers ?? []).map((offer) => {
      const offerPrices = (offer.prices ?? []) as OfferPrice[]
      const prices: Record<string, number | ""> = {}
      for (const code of currencies) {
        const match = offerPrices.find(
          (p) => isBasePrice(p) && p.currency_code === code,
        )
        prices[code] = match?.amount ?? ""
      }
      const region_prices: Record<string, number | ""> = {}
      for (const region of regions) {
        const match = offerPrices.find((p) => isRegionPrice(p, region.id))
        region_prices[region.id] = match?.amount ?? ""
      }
      return {
        offer_id: offer.id,
        variant_title: variant.title ?? "",
        product_thumbnail: product.thumbnail ?? null,
        prices,
        region_prices,
      }
    }),
  )

const columnHelper = createDataGridHelper<EditPriceRow, FormValues>()

const useColumns = ({
  currencies,
  regions,
  pricePreferences,
}: {
  currencies: string[]
  regions: Region[]
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
        header: t("fields.title"),
        cell: (context) => {
          const entity = context.row.original
          return (
            <DataGrid.ReadonlyCell context={context}>
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <Thumbnail src={entity.product_thumbnail ?? null} />
                <span className="truncate" title={entity.variant_title}>
                  {entity.variant_title}
                </span>
              </div>
            </DataGrid.ReadonlyCell>
          )
        },
        disableHiding: true,
      }),
      ...createDataGridPriceColumns<EditPriceRow, FormValues>({
        currencies,
        pricePreferences: pricePreferences ?? [],
        getFieldName: (context, value) =>
          `rows.${context.row.index}.prices.${value}`,
        t,
      }),
      ...createDataGridPriceColumns<EditPriceRow, FormValues>({
        currencies: cellCurrencies,
        regions,
        pricePreferences: pricePreferences ?? [],
        getFieldName: (context, value) =>
          `rows.${context.row.index}.region_prices.${value}`,
        t,
      }).filter((column) => column.id?.startsWith("region_prices")),
    ]
  }, [t, currencies, regions, pricePreferences])
}

const EditPriceGrid = ({
  product,
  productId,
}: {
  product: PriceProduct
  productId: string
}) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const { currencies, regions } = useSellerCurrencies()
  const canViewPricePreferences = useCan("price_preferences")
  const { price_preferences: pricePreferences } = usePricePreferences(
    {},
    { enabled: canViewPricePreferences }
  )

  const rows = useMemo(
    () => buildRows(product, currencies, regions),
    [product, currencies, regions],
  )

  const form = useForm<FormValues>({ defaultValues: { rows } })
  const columns = useColumns({ currencies, regions, pricePreferences })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await Promise.all(
        values.rows.map((row) => {
          const prices: {
            amount: number
            currency_code: string
            rules?: Record<string, string>
          }[] = []
          for (const code of currencies) {
            const value = row.prices?.[code]
            if (value === "" || value === null || value === undefined) continue
            prices.push({ amount: numericOrZero(value), currency_code: code })
          }
          for (const region of regions) {
            const value = row.region_prices?.[region.id]
            if (value === "" || value === null || value === undefined) continue
            prices.push({
              amount: numericOrZero(value),
              currency_code: region.currency_code,
              rules: { region_id: region.id },
            })
          }
          return sdk.vendor.offers.$id.mutate({ $id: row.offer_id, prices })
        }),
      )
      await queryClient.invalidateQueries({ queryKey: offerQueryKeys.lists() })
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      })
      toast.success(t("offers.pricing.successToast"))
      handleSuccess()
    } catch (error) {
      toast.error((error as Error).message)
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
        data-testid="offer-edit-price-form"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex-1 overflow-hidden p-0">
          <DataGrid
            columns={columns}
            data={rows}
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
            <Button
              size="small"
              type="submit"
              isLoading={form.formState.isSubmitting}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

export const OfferEditPricePage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { product, isPending, isError, error } = useProduct(id!, {
    fields: OFFER_PRODUCT_DETAIL_FIELDS,
  })

  const forbidden = isError && isForbidden(error)

  if (isError && !forbidden) throw error

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.pricing.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.pricing.description")}</span>
      </RouteFocusModal.Description>
      {forbidden ? (
        <>
          <RouteFocusModal.Header />
          <RouteFocusModal.Body>
            <SectionNoAccess />
          </RouteFocusModal.Body>
        </>
      ) : (
        !isPending &&
        product && (
          <EditPriceGrid product={product as PriceProduct} productId={id!} />
        )
      )}
    </RouteFocusModal>
  )
}

export const Component = OfferEditPricePage
