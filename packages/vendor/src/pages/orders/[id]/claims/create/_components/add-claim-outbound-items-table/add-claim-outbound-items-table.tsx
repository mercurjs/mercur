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
  useClaimOutboundItemTableColumns,
} from "./use-claim-outbound-item-table-columns"
import { useClaimOutboundItemTableFilters } from "./use-claim-outbound-item-table-filters"
import { useClaimOutboundItemTableQuery } from "./use-claim-outbound-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

// Field set covers the picker columns + the variant_id needed downstream
// when items are submitted to `useAddClaimOutboundItems`. Same shape as
// the order-edit picker — only offers that (a) have a price in the order's
// currency and (b) have inventory stock are surfaced.
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

type AddClaimOutboundItemsTableProps = {
  /**
   * Currency code of the parent order. Offers without a matching price are
   * dropped from the picker so sellers can only replace with items they
   * can actually charge for.
   */
  currencyCode?: string
  /**
   * Receives the picked offer ids AND a lookup map of the selected offer
   * rows (id → row). The form layer forwards the ids to
   * `useAddClaimOutboundItems` as `{ offer_id, quantity }`; the lookup is
   * used to enrich the staged outbound row with title / sku / thumbnail
   * so the list doesn't render the raw `offer_…` ulid as a "title".
   */
  onSelectionChange: (
    offerIds: string[],
    offers: Record<string, OfferPickerRowExtended>
  ) => void
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

export const AddClaimOutboundItemsTable = ({
  currencyCode,
  onSelectionChange,
}: AddClaimOutboundItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  // Lookup of every offer the picker has seen this session so the
  // section can still resolve titles for offers selected on a previous
  // page after the user paginates away.
  const [offerLookup, setOfferLookup] = useState<
    Record<string, OfferPickerRowExtended>
  >({})

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    onSelectionChange(Object.keys(newState), offerLookup)
  }

  const { searchParams, raw } = useClaimOutboundItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const offersResponse = useOffers({
    ...searchParams,
    fields: OFFER_PICKER_FIELDS,
  })

  const rawOffers = ((
    offersResponse as unknown as { offers?: OfferPickerRowExtended[] }
  ).offers ?? []) as OfferPickerRowExtended[]

  const offers = useMemo<OfferPickerRowExtended[]>(() => {
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

  // Accumulate every filtered offer this session into a lookup table so
  // the section can resolve titles for offers selected on a previous
  // page after the user paginates away. Refs would also work; useState
  // keeps the picker functional and avoids the stale-closure trap.
  useMemo(() => {
    if (!offers.length) return
    setOfferLookup((prev) => {
      let changed = false
      const next = { ...prev }
      for (const offer of offers) {
        if (!next[offer.id]) {
          next[offer.id] = offer
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [offers])

  const count = offers.length

  const columns = useClaimOutboundItemTableColumns()
  const filters = useClaimOutboundItemTableFilters()

  const { table } = useDataTable({
    data: offers,
    columns,
    count,
    enablePagination: true,
    // Row id = offer id so onSelectionChange yields offer_ids that the form
    // layer sends to `useAddClaimOutboundItems` (which accepts `offer_id` and
    // resolves to variant_id + unit_price server-side).
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
      data-testid="add-claim-outbound-picker"
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
