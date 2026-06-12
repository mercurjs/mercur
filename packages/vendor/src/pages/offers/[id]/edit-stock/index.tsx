import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { Button, toast } from "@medusajs/ui"
import { useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { Thumbnail } from "../../../../components/common/thumbnail"
import {
  createDataGridHelper,
  createDataGridLocationStockColumns,
  DataGrid,
} from "../../../../components/data-grid"
import { RouteFocusModal, useRouteModal } from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import { useBatchInventoryItemsLocationLevels } from "../../../../hooks/api/inventory"
import { useProduct, productsQueryKeys } from "../../../../hooks/api/products"
import { offerQueryKeys } from "../../../../hooks/api/offers"
import { useStockLocations } from "../../../../hooks/api/stock-locations"
import { queryClient } from "../../../../lib/query-client"
import { OFFER_PRODUCT_DETAIL_FIELDS } from "../../common/constants"

type LocationLevel = { checked: boolean; quantity: number | ""; id?: string }

type EditStockRow = {
  offer_id: string
  inventory_item_id?: string | null
  variant_title: string
  product_thumbnail?: string | null
  sku?: string | null
  inventory: Record<string, LocationLevel>
}

type FormValues = { rows: EditStockRow[] }

/**
 * The wrap returns each offer with its inventory link + per-location
 * stock levels (OFFER_WRAP_FIELDS). `OfferDTO` doesn't model that link
 * relation, so extend it with the `inventory_item_link` the wrap adds.
 */
type OfferWithInventory = OfferDTO & {
  inventory_item_link?: Array<{
    inventory_item_id?: string | null
    inventory_item?: {
      location_levels?: Array<{
        id?: string | null
        location_id?: string | null
        stocked_quantity?: number | null
      }> | null
    } | null
  }> | null
}

type StockProduct = HttpTypes.AdminProduct & {
  variants?: Array<
    HttpTypes.AdminProductVariant & { offers?: OfferWithInventory[] | null }
  > | null
}

const castNumber = (v: number | "" | undefined | null): number =>
  v === "" || v === null || v === undefined ? 0 : Number(v) || 0

const buildRows = (
  product: StockProduct,
  locations: HttpTypes.AdminStockLocation[],
): EditStockRow[] =>
  (product.variants ?? []).flatMap((variant) =>
    (variant.offers ?? []).map((offer) => {
      const link = offer.inventory_item_link?.[0]
      const levels = link?.inventory_item?.location_levels ?? []
      const inventory: Record<string, LocationLevel> = {}
      for (const loc of locations) {
        const level = levels.find((l) => l.location_id === loc.id)
        inventory[loc.id] = level
          ? {
              checked: true,
              quantity: level.stocked_quantity ?? 0,
              id: level.id ?? undefined,
            }
          : { checked: false, quantity: "" }
      }
      return {
        offer_id: offer.id,
        inventory_item_id: link?.inventory_item_id ?? null,
        variant_title: variant.title ?? "",
        product_thumbnail: product.thumbnail ?? null,
        sku: offer.sku ?? variant.sku ?? null,
        inventory,
      }
    }),
  )

const columnHelper = createDataGridHelper<EditStockRow, FormValues>()

const useColumns = ({
  stockLocations,
}: {
  stockLocations: HttpTypes.AdminStockLocation[]
}) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
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
      columnHelper.column({
        id: "sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        cell: (context) => (
          <DataGrid.ReadonlyCell context={context}>
            <span className="truncate">{context.row.original.sku ?? "-"}</span>
          </DataGrid.ReadonlyCell>
        ),
      }),
      ...createDataGridLocationStockColumns<EditStockRow, FormValues>({
        stockLocations,
        getFieldName: (context, index) => {
          const location = stockLocations[index]
          if (!location) return null
          return `rows.${context.row.index}.inventory.${location.id}`
        },
        t,
      }),
    ],
    [t, stockLocations],
  )
}

const EditStockGrid = ({
  product,
  productId,
  locations,
}: {
  product: StockProduct
  productId: string
  locations: HttpTypes.AdminStockLocation[]
}) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const { mutateAsync, isPending } = useBatchInventoryItemsLocationLevels()

  const rows = useMemo(
    () => buildRows(product, locations),
    [product, locations],
  )
  const initial = useRef(rows)

  const form = useForm<FormValues>({ defaultValues: { rows } })
  const columns = useColumns({ stockLocations: locations })

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: HttpTypes.AdminBatchInventoryItemsLocationLevels = {
      create: [],
      update: [],
      delete: [],
      force: true,
    }

    values.rows.forEach((row, index) => {
      const itemId = row.inventory_item_id
      if (!itemId) return
      const initialRow = initial.current[index]
      for (const [locationId, level] of Object.entries(row.inventory)) {
        const prior = initialRow?.inventory?.[locationId]
        if (level.id) {
          if (prior?.checked && !level.checked) {
            payload.delete!.push(level.id)
          } else {
            const next = castNumber(level.quantity)
            if (next !== castNumber(prior?.quantity)) {
              payload.update!.push({
                inventory_item_id: itemId,
                location_id: locationId,
                stocked_quantity: next,
              })
            }
          }
        } else if (level.checked && level.quantity !== "") {
          payload.create!.push({
            inventory_item_id: itemId,
            location_id: locationId,
            stocked_quantity: castNumber(level.quantity),
          })
        }
      }
    })

    await mutateAsync(payload, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: offerQueryKeys.lists(),
        })
        await queryClient.invalidateQueries({
          queryKey: productsQueryKeys.detail(productId),
        })
        toast.success(t("offers.inventory.successToast"))
        handleSuccess()
      },
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
        data-testid="offer-edit-stock-form"
      >
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
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

export const OfferEditStockPage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { product, isPending, isError, error } = useProduct(id!, {
    fields: OFFER_PRODUCT_DETAIL_FIELDS,
  })
  const { stock_locations, isPending: isLocationsPending } = useStockLocations({
    limit: 100,
  })

  if (isError) throw error

  const ready =
    !isPending && !!product && !isLocationsPending && !!stock_locations

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.inventory.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.inventory.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        <EditStockGrid
          product={product as StockProduct}
          productId={id!}
          locations={stock_locations as HttpTypes.AdminStockLocation[]}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = OfferEditStockPage
