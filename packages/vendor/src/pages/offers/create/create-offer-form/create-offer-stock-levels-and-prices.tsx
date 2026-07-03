import { HttpTypes } from "@medusajs/types";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  createDataGridHelper,
  createDataGridLocationStockColumns,
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../components/data-grid";
import { Thumbnail } from "../../../../components/common/thumbnail";
import { useRouteModal } from "../../../../components/modals";
import { defineTabMeta } from "../../../../components/tabbed-form/types";
import { usePricePreferences } from "../../../../hooks/api/price-preferences";
import { useCurrentSeller } from "../../../../hooks/api/sellers";
import { useShippingProfiles } from "../../../../hooks/api/shipping-profiles";
import { useStockLocations } from "../../../../hooks/api/stock-locations";
import { CreateOfferFormValues, OfferVariantRow } from "./schema";

type ShippingProfileLite = { id: string; name?: string | null };

/**
 * The grid interleaves a non-editable product "group" row above each
 * product's variants (SPEC-009 / Figma `40016485:530743`). The form's
 * `variants` array stays variant-only; each variant grid row carries its
 * `__formIndex` so field paths bind to the right form entry regardless of
 * the interleaved group rows.
 */
type ProductGroupRow = {
  __group: true;
  id: string;
  product_title: string;
};
type VariantGridRow = OfferVariantRow & {
  __group?: false;
  __formIndex: number;
};
type GridRow = ProductGroupRow | VariantGridRow;

const isGroup = (row: GridRow): row is ProductGroupRow =>
  (row as ProductGroupRow).__group === true;

const Root = () => {
  const form = useFormContext<CreateOfferFormValues>();
  const { setCloseOnEscape } = useRouteModal();

  const { currency_code } = useCurrentSeller();
  const { stock_locations } = useStockLocations({ limit: 100 });
  const { shipping_profiles } = useShippingProfiles({ limit: 100 }) as {
    shipping_profiles?: ShippingProfileLite[];
  };
  const { price_preferences: pricePreferences } = usePricePreferences({});

  const variants = useWatch({
    control: form.control,
    name: "variants",
  }) as OfferVariantRow[] | undefined;

  const gridData = useMemo<GridRow[]>(() => {
    const rows: GridRow[] = [];
    let lastProductId: string | undefined;
    (variants ?? []).forEach((variant, index) => {
      if (variant.product_id !== lastProductId) {
        rows.push({
          __group: true,
          id: `group-${variant.product_id}`,
          product_title: variant.product_title,
        });
        lastProductId = variant.product_id;
      }
      rows.push({ ...variant, __group: false, __formIndex: index });
    });
    return rows;
  }, [variants]);

  const columns = useColumns({
    currencyCode: currency_code,
    stockLocations: stock_locations as
      | HttpTypes.AdminStockLocation[]
      | undefined,
    shippingProfiles: shipping_profiles ?? [],
    pricePreferences,
  });

  return (
    <div
      className="flex size-full flex-col overflow-hidden"
      data-testid="offer-create-tab-stockLevelsAndPrices"
    >
      <DataGrid
        columns={columns}
        data={gridData}
        state={form}
        onEditingChange={(editing) => setCloseOnEscape(!editing)}
      />
    </div>
  );
};

type ColumnArgs = {
  currencyCode?: string;
  stockLocations?: HttpTypes.AdminStockLocation[];
  shippingProfiles?: ShippingProfileLite[];
  pricePreferences?: HttpTypes.AdminPricePreference[];
};

const columnHelper = createDataGridHelper<GridRow, CreateOfferFormValues>();

const useColumns = ({
  currencyCode,
  stockLocations = [],
  shippingProfiles = [],
  pricePreferences = [],
}: ColumnArgs) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const shippingProfileOptions = shippingProfiles.map((p) => ({
      value: p.id,
      label: p.name ?? p.id,
    }));
    const currencies = currencyCode ? [currencyCode] : [];

    return [
      columnHelper.column({
        id: "title",
        header: t("fields.title"),
        cell: (context) => {
          const row = context.row.original;
          if (isGroup(row)) {
            return (
              <DataGrid.ReadonlyCell context={context}>
                <span
                  className="text-ui-fg-subtle truncate font-medium"
                  title={row.product_title}
                >
                  {row.product_title}
                </span>
              </DataGrid.ReadonlyCell>
            );
          }
          const title = row.variant_title || "";
          return (
            <DataGrid.ReadonlyCell context={context}>
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <Thumbnail src={row.product_thumbnail ?? null} />
                <span className="truncate" title={title}>
                  {title}
                </span>
              </div>
            </DataGrid.ReadonlyCell>
          );
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        field: (context) => {
          const row = context.row.original;
          return isGroup(row) ? null : `variants.${row.__formIndex}.sku`;
        },
        type: "text",
        cell: (context) =>
          isGroup(context.row.original) ? (
            <DataGrid.ReadonlyCell context={context} />
          ) : (
            <DataGrid.TextCell context={context} />
          ),
      }),
      columnHelper.column({
        id: "shipping_profile",
        name: t("offers.fields.shippingProfile"),
        header: t("offers.fields.shippingProfile"),
        field: (context) => {
          const row = context.row.original;
          return isGroup(row)
            ? null
            : `variants.${row.__formIndex}.shipping_profile_id`;
        },
        type: "select",
        cell: (context) =>
          isGroup(context.row.original) ? (
            <DataGrid.ReadonlyCell context={context} />
          ) : (
            <DataGrid.SelectCell
              context={context}
              options={shippingProfileOptions}
              placeholder=""
            />
          ),
      }),
      ...createDataGridLocationStockColumns<GridRow, CreateOfferFormValues>({
        stockLocations,
        isReadyOnly: (context) => isGroup(context.row.original),
        getFieldName: (context, index) => {
          const row = context.row.original;
          if (isGroup(row)) return null;
          const location = stockLocations[index];
          if (!location) return null;
          return `variants.${row.__formIndex}.inventory.${location.id}`;
        },
        t,
      }),
      ...createDataGridPriceColumns<GridRow, CreateOfferFormValues>({
        currencies,
        pricePreferences,
        isReadyOnly: (context) => isGroup(context.row.original),
        getFieldName: (context, value) => {
          const row = context.row.original;
          if (isGroup(row)) return null;
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${row.__formIndex}.prices.${value}`;
          }
          return null;
        },
        t,
      }),
    ];
  }, [t, currencyCode, stockLocations, shippingProfiles, pricePreferences]);
};

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "stockLevelsAndPrices",
  labelKey: "offers.create.tabs.stockLevelsAndPrices",
});

export const CreateOfferStockLevelsAndPricesTab = Root;
