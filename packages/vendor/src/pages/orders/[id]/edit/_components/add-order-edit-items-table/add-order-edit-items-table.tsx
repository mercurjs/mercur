import { HttpTypes } from "@medusajs/types";
import { OfferDTO } from "@mercurjs/types";
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { _DataTable } from "@components/table/data-table";
import { useOffers } from "@hooks/api/offers";
import { useDataTable } from "@hooks/use-data-table";

import {
  OfferPickerRow,
  useOrderEditItemsTableColumns,
} from "./use-order-edit-item-table-columns";
import { useOrderEditItemTableFilters } from "./use-order-edit-item-table-filters";
import { useOrderEditItemTableQuery } from "./use-order-edit-item-table-query";

const PAGE_SIZE = 50;
const PREFIX = "rit";

// Field set covers the picker columns + the variant_id needed downstream when
// items are submitted to the order-edit / exchange / claim "add items" routes.
// `prices.*` + `product_variant.inventory_items.required_quantity` /
// `inventory.location_levels.available_quantity` / `manage_inventory` feed the
// picker defaults: only show offers that have a price in the order's currency
// AND have inventory (or `manage_inventory=false`). The vendor
// `sdk.vendor.offers.query` is seller-scoped at the API boundary, so the
// "from selected store" rule is implicit — no extra param needed.
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
].join(",");

// The picker row is an `OfferDTO` joined with the variant's inventory
// surface from the Medusa product module. `OfferDTO` already carries the
// `prices` and `inventory_items` link relations; `product_variant` is
// the joined `AdminProductVariant` Medusa returns via the offer ↔ variant
// module link.
type OfferPickerRowExtended = OfferPickerRow &
  Pick<OfferDTO, "prices"> & {
    product_variant?: OfferPickerRow["product_variant"] &
      Pick<
        HttpTypes.AdminProductVariant,
        "manage_inventory" | "inventory_quantity" | "inventory_items"
      >;
  };

type AddOrderEditItemsTableProps = {
  /**
   * The currency of the order this picker is feeding. Offers without a
   * matching price are filtered out by the picker defaults.
   */
  currencyCode?: string;
  /**
   * Receives the picked **offer IDs**. The modal layer passes them to
   * `useAddOrderEditItems` / `useAddExchangeOutboundItems` /
   * `useAddClaimOutboundItems` as `{ offer_id, quantity }`. The vendor backend
   * resolves the offer to `variant_id + unit_price + shipping_profile_id` and
   * persists the `order_line_item ↔ offer` link via subscriber on confirm.
   */
  onSelectionChange: (offerIds: string[]) => void;
};

const offerHasInventory = (offer: OfferPickerRowExtended): boolean => {
  const variant = offer.product_variant;
  if (!variant) return false;
  if (variant.manage_inventory === false) return true;

  // Bundle-aware check: for each linked inventory_item, sum available across
  // location levels, divide by required_quantity. Offer has inventory only
  // when every linked item can satisfy at least one unit.
  const links = variant.inventory_items ?? [];
  if (!links.length) {
    return (variant.inventory_quantity ?? 0) > 0;
  }
  return links.every((link) => {
    const available = (link.inventory?.location_levels ?? []).reduce(
      (acc, lvl) => acc + (lvl.available_quantity ?? 0),
      0
    );
    const required = link.required_quantity ?? 1;
    return required > 0 && available >= required;
  });
};

export const AddOrderEditItemsTable = ({
  currencyCode,
  onSelectionChange,
}: AddOrderEditItemsTableProps) => {
  const { t } = useTranslation();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn;

    setRowSelection(newState);
    onSelectionChange(Object.keys(newState));
  };

  const { searchParams, raw } = useOrderEditItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const offersResponse = useOffers({
    ...searchParams,
    fields: OFFER_PICKER_FIELDS,
  });
  const rawOffers = ((offersResponse as any).offers ??
    []) as OfferPickerRowExtended[];
  const rawCount = (offersResponse as any).count ?? 0;

  // Picker defaults: only offers (1) with a price in the order's currency
  // and (2) with stock. Filter client-side — the alternative is a
  // `with_price` + `inventory_quantity_gte` backend param that doesn't
  // exist on `GET /vendor/offers` today.
  const offers = useMemo<OfferPickerRowExtended[]>(() => {
    return rawOffers.filter((offer) => {
      if (currencyCode) {
        const hasPrice = (offer.prices ?? []).some(
          (p) => p.currency_code === currencyCode
        );
        if (!hasPrice) return false;
      }
      return offerHasInventory(offer);
    });
  }, [rawOffers, currencyCode]);

  // Surface the post-filter count so the pagination footer reflects what
  // the seller actually sees. For pages where every offer is filtered out
  // this will read "0 of 0"; rawCount on the response remains the unfiltered
  // total in case it's needed for debugging.
  const count = offers.length;
  void rawCount;

  const columns = useOrderEditItemsTableColumns();
  const filters = useOrderEditItemTableFilters();

  const { table } = useDataTable({
    data: offers,
    columns,
    count,
    enablePagination: true,
    // Row id = offer id so onSelectionChange yields offer_ids that the modal
    // layer sends to the backend item-add routes (which accept `offer_id` and
    // resolve to variant_id + unit_price server-side).
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: () => true,
    rowSelection: {
      state: rowSelection,
      updater,
    },
  });

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
  );
};
