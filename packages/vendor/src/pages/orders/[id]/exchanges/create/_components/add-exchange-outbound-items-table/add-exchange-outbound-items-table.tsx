import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table"
import { useOffers } from "@hooks/api/offers"
import { useDataTable } from "@hooks/use-data-table"

import {
  OutboundOfferPickerRow,
  useExchangeOutboundItemTableColumns,
} from "./use-exchange-outbound-item-table-columns"
import { useExchangeOutboundItemTableFilters } from "./use-exchange-outbound-item-table-filters"
import { useExchangeOutboundItemTableQuery } from "./use-exchange-outbound-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

// Field set covers the picker columns + variant_id needed downstream.
// `prices.*` + `product_variant.*.inventory*` feed the offer picker
// defaults: only show offers that have a price in the order's currency
// AND have inventory (or `manage_inventory=false`). Mirrors
// `add-order-edit-items-table` from the Edit Order flow.
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

// The picker row is an `OfferDTO` joined with the variant inventory
// surface from the Medusa product module. `OfferDTO` already carries the
// `prices` and `inventory_items` link relations; `product_variant` is
// the joined `AdminProductVariant` Medusa returns via the offer ↔ variant
// module link.
type OutboundOfferPickerRowExtended = OutboundOfferPickerRow &
  Pick<OfferDTO, "prices"> & {
    product_variant?: OutboundOfferPickerRow["product_variant"] &
      Pick<
        HttpTypes.AdminProductVariant,
        "manage_inventory" | "inventory_quantity" | "inventory_items"
      >
  }

type AddExchangeOutboundItemsTableProps = {
  /**
   * The currency of the order this picker is feeding. Offers without a
   * matching price are filtered out by the picker defaults.
   */
  currencyCode?: string
  /**
   * Receives the picked **offer IDs**. The modal layer passes them to
   * `useAddExchangeOutboundItems` as `{ offer_id, quantity }`. The vendor
   * backend resolves the offer to `variant_id + unit_price` and persists
   * the `order_line_item ↔ offer` link via subscriber on confirm.
   */
  onSelectionChange: (offerIds: string[]) => void
  selectedItems?: string[]
}

const offerHasInventory = (offer: OutboundOfferPickerRowExtended): boolean => {
  const variant = offer.product_variant
  if (!variant) return false
  if (variant.manage_inventory === false) return true

  // Bundle-aware check: for each linked inventory_item, sum available across
  // location levels, divide by required_quantity. Offer has inventory only
  // when every linked item can satisfy at least one unit.
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

export const AddExchangeOutboundItemsTable = ({
  currencyCode,
  onSelectionChange,
  selectedItems = [],
}: AddExchangeOutboundItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    selectedItems.reduce<RowSelectionState>((acc, id) => {
      acc[id] = true
      return acc
    }, {})
  )

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    onSelectionChange(Object.keys(newState))
  }

  const { searchParams, raw } = useExchangeOutboundItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const offersResponse = useOffers({
    ...searchParams,
    fields: OFFER_PICKER_FIELDS,
  }) as unknown as {
    offers?: OutboundOfferPickerRowExtended[]
    count?: number
  }
  const rawOffers = offersResponse.offers ?? []
  const rawCount = offersResponse.count ?? 0

  // Picker defaults: only offers (1) with a price in the order's currency
  // and (2) with stock. Filter client-side — the alternative is a
  // `with_price` + `inventory_quantity_gte` backend param that doesn't
  // exist on `GET /vendor/offers` today.
  const offers = useMemo<OutboundOfferPickerRowExtended[]>(() => {
    return rawOffers.filter((offer) => {
      if (currencyCode) {
        const hasPrice = (offer.prices ?? []).some(
          (p) => p.currency_code === currencyCode
        )
        if (!hasPrice) return false
      }
      return offerHasInventory(offer)
    })
  }, [rawOffers, currencyCode])

  // Surface the post-filter count so the pagination footer reflects what
  // the seller actually sees. rawCount stays available for debugging if
  // we ever push the filtering into the backend.
  const count = offers.length
  void rawCount

  const columns = useExchangeOutboundItemTableColumns()
  const filters = useExchangeOutboundItemTableFilters()

  const { table } = useDataTable({
    data: offers,
    columns,
    count,
    enablePagination: true,
    // Row id = offer id so onSelectionChange yields offer_ids that the
    // modal layer sends to the backend item-add routes (which accept
    // `offer_id` and resolve to variant_id + unit_price server-side).
    getRowId: (row) => row.id,
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
