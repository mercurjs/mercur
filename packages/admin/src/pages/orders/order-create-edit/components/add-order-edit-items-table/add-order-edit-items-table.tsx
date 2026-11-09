import { SectionNoAccess, useCan } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@medusajs/types"
import { OfferDTO } from "@mercurjs/types"
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useRef, useState } from "react"
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
// picker: only offers with a price in the order's currency AND inventory (or
// `manage_inventory=false`) can be selected.
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
  "product_variant.product.categories.id",
  "product_variant.product.categories.name",
  "product_variant.product.collection.title",
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
   * in this currency are listed but can't be selected.
   */
  currencyCode?: string
  /**
   * Seller that owns the order. Only this seller's offers can be added,
   * so the picker never lists offers from other stores.
   */
  sellerId?: string
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
  sellerId,
  onSelectionChange,
}: AddOrderEditItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useOrderEditItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const canViewOffers = useCan("offers")
  const offersResponse = useOffers(
    {
      ...searchParams,
      seller_id: sellerId,
      fields: OFFER_PICKER_FIELDS,
    },
    { enabled: canViewOffers && !!sellerId }
  ) as unknown as {
    offers?: OfferPickerRowExtended[]
    count?: number
  }
  const count = offersResponse.count ?? 0

  // Offers that can't be added stay listed but unselectable: hiding them
  // client-side would break the server-side pagination and count.
  const offers = useMemo<OfferPickerRowExtended[]>(() => {
    return (offersResponse.offers ?? []).map((offer) => {
      const hasPrice =
        !currencyCode ||
        (offer.prices ?? []).some((p) => p.currency_code === currencyCode)

      if (!hasPrice) {
        return {
          ...offer,
          unavailable_reason: t("orders.edits.offerNoPriceTooltip", {
            currency: currencyCode?.toUpperCase(),
          }),
        }
      }

      if (!offerHasInventory(offer)) {
        return {
          ...offer,
          unavailable_reason: t("orders.edits.offerOutOfStockTooltip"),
        }
      }

      return offer
    })
  }, [offersResponse.offers, currencyCode, t])

  const columns = useOrderEditItemsTableColumns()
  const filters = useOrderEditItemTableFilters()

  // Selections can span pages, so keep every seen offer's variant id around
  // to turn selected offer ids back into `{ variantId, offerId }` pairs.
  const variantIdByOfferId = useRef(new Map<string, string>())
  for (const offer of offers) {
    if (offer.id && offer.variant_id) {
      variantIdByOfferId.current.set(offer.id, offer.variant_id)
    }
  }

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    const pairs = Object.keys(newState).flatMap((offerId) => {
      const variantId = variantIdByOfferId.current.get(offerId)
      return variantId ? [{ variantId, offerId }] : []
    })
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
    prefix: PREFIX,
    enableRowSelection: (row) => !row.original.unavailable_reason,
    rowSelection: {
      state: rowSelection,
      updater,
    },
  })

  if (!canViewOffers) {
    return <SectionNoAccess />
  }

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
