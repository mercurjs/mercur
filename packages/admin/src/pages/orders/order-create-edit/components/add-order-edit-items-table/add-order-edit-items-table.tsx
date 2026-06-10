import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table"
import { useOffers } from "@hooks/api/offers"
import { useDataTable } from "@hooks/use-data-table"

import {
  OfferPickerRow,
  useOrderEditItemsTableColumns,
} from "./use-order-edit-item-table-columns"
import { useOrderEditItemTableFilters } from "./use-order-edit-item-table-filters"
import { useOrderEditItemTableQuery } from "./use-order-edit-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

// Field set covers the picker columns + the variant_id needed downstream when
// items are submitted to the order-edit / exchange / claim "add items" routes.
// `prices.*` + `product_variant.inventory_items.required_quantity` /
// `inventory.location_levels.available_quantity` / `manage_inventory` feed the
// picker defaults: only show offers that have a price in the order's currency
// AND have inventory (or `manage_inventory=false`).
const OFFER_PICKER_FIELDS = [
  "id",
  "sku",
  "variant_id",
  "seller_id",
  "prices.amount",
  "prices.currency_code",
  "product_variant.id",
  "product_variant.title",
  "product_variant.product.id",
  "product_variant.product.title",
  "product_variant.product.thumbnail",
  "product_variant.manage_inventory",
  "product_variant.inventory_quantity",
  "product_variant.inventory_items.required_quantity",
  "product_variant.inventory_items.inventory.location_levels.available_quantity",
].join(",")

type OfferPickerRowExtended = OfferPickerRow &
  Pick<OfferDTO, "prices"> & {
    product_variant?: OfferPickerRow["product_variant"] &
      Pick<
        HttpTypes.AdminProductVariant,
        "manage_inventory" | "inventory_quantity" | "inventory_items"
      >
  }

export type OfferPickerSelection = { variantId: string; offerId: string }

type AddOrderEditItemsTableProps = {
  /**
   * Currency of the order this picker is feeding. Offers without a price
   * in this currency are filtered out by the picker defaults.
   */
  currencyCode?: string
  /**
   * Receives the picked rows as `{ variantId, offerId }` pairs. The admin
   * backend overrides at `packages/core/src/api/admin/order-edits/[id]/
   * items` read `metadata.offer_id` to apply offer-aware unit pricing and
   * the bundle-reservation multiplier — so the offer id must travel
   * alongside the variant id.
   */
  onSelectionChange: (selections: OfferPickerSelection[]) => void
}

const offerHasInventory = (offer: OfferPickerRowExtended): boolean => {
  const variant = offer.product_variant
  if (!variant) return false
  if (variant.manage_inventory === false) return true

  const links = variant.inventory_items ?? []
  if (!links.length) {
    return (variant.inventory_quantity ?? 0) > 0
  }
  return links.every((link) => {
    const available = (link.inventory?.location_levels ?? []).reduce(
      (acc, lvl) => acc + (lvl.available_quantity ?? 0),
      0
    )
    const required = link.required_quantity ?? 1
    return required > 0 && available >= required
  })
}

export const AddOrderEditItemsTable = ({
  currencyCode,
  onSelectionChange,
}: AddOrderEditItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useOrderEditItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const offersResponse = useOffers({
    ...searchParams,
    fields: OFFER_PICKER_FIELDS,
  }) as unknown as {
    offers?: OfferPickerRowExtended[]
    count?: number
  }
  const rawCount = offersResponse.count ?? 0

  const offers = useMemo<OfferPickerRowExtended[]>(() => {
    const rawOffers = offersResponse.offers ?? []
    return rawOffers.filter((offer) => {
      if (currencyCode) {
        const hasPrice = (offer.prices ?? []).some(
          (p) => p.currency_code === currencyCode
        )
        if (!hasPrice) return false
      }
      return offerHasInventory(offer)
    })
  }, [offersResponse.offers, currencyCode])

  const count = offers.length
  void rawCount

  const columns = useOrderEditItemsTableColumns()
  const filters = useOrderEditItemTableFilters()

  // Map offer id -> { variantId, offerId } so the row's selection state can be
  // turned back into the `{ variantId, offerId }` pairs the parent submits.
  const selectionByOfferId = useMemo(() => {
    const map = new Map<string, OfferPickerSelection>()
    for (const offer of offers) {
      if (offer.id && offer.variant_id) {
        map.set(offer.id, { variantId: offer.variant_id, offerId: offer.id })
      }
    }
    return map
  }, [offers])

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    const pairs = Object.keys(newState)
      .map((offerId) => selectionByOfferId.get(offerId))
      .filter((p): p is OfferPickerSelection => !!p)
    onSelectionChange(pairs)
  }

  const { table } = useDataTable({
    data: offers,
    columns,
    count,
    enablePagination: true,
    // Row id is the offer id so each offer has its own row (two offers backed
    // by the same variant no longer collapse). The parent maps each picked
    // row to `{ variantId, offerId }` and sends `metadata.offer_id` so the
    // admin override route can apply the offer's price + reservation math.
    getRowId: (row) => row.id ?? row.variant_id!,
    pageSize: PAGE_SIZE,
    enableRowSelection: () => true,
    rowSelection: {
      state: rowSelection,
      updater,
    },
  })

  return (
    <div
      className="flex size-full flex-col overflow-hidden"
      data-testid="add-offers-picker"
    >
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        filters={filters}
        pagination
        layout="fill"
        search
        orderBy={[
          { key: "sku", label: t("fields.sku") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        prefix={PREFIX}
        queryObject={raw}
      />
    </div>
  )
}
