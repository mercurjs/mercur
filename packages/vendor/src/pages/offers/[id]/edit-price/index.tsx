import { HttpTypes } from "@medusajs/types"
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
import { sdk } from "../../../../lib/client"
import { queryClient } from "../../../../lib/query-client"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../../common/constants"
import { useSellerCurrencies } from "../../common/use-seller-currencies"
import {
  buildPricePayload,
  buildRows,
  EditPriceRow,
  PriceProduct,
  Region,
} from "./utils"

type FormValues = { rows: EditPriceRow[] }

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
  currencies,
  regions,
}: {
  product: PriceProduct
  productId: string
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

  const rows = useMemo(
    () => buildRows(product, currencies, regions),
    [product, currencies, regions],
  )

  const form = useForm<FormValues>({ defaultValues: { rows } })
  const columns = useColumns({ currencies, regions, pricePreferences })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await Promise.all(
        values.rows.map((row) =>
          sdk.vendor.offers.$id.mutate({
            $id: row.offer_id,
            prices: buildPricePayload(row, currencies, regions),
          }),
        ),
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
  const {
    currencies,
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useSellerCurrencies()

  const forbidden = isError && isForbidden(error)

  if (isError && !forbidden) throw error
  if (isRegionsError) throw regionsError

  const ready = !isPending && !!product && !isRegionsPending

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
        ready && (
          <EditPriceGrid
            product={product as PriceProduct}
            productId={id!}
            currencies={currencies}
            regions={regions}
          />
        )
      )}
    </RouteFocusModal>
  )
}

export const Component = OfferEditPricePage
