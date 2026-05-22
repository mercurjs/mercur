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
        data={variants ?? []}
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

const columnHelper = createDataGridHelper<
  OfferVariantRow,
  CreateOfferFormValues
>();

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
          const entity = context.row.original;
          const title = entity.variant_title || "";
          return (
            <DataGrid.ReadonlyCell context={context}>
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <Thumbnail src={entity.product_thumbnail ?? null} />
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
        field: (context) => `variants.${context.row.index}.sku`,
        type: "text",
        cell: (context) => <DataGrid.TextCell context={context} />,
      }),
      columnHelper.column({
        id: "shipping_profile",
        name: t("shippingProfile.domain"),
        header: t("shippingProfile.domain"),
        field: (context) => `variants.${context.row.index}.shipping_profile_id`,
        type: "select",
        cell: (context) => (
          <DataGrid.SelectCell
            context={context}
            options={shippingProfileOptions}
            placeholder={t("shippingProfile.domain")}
          />
        ),
      }),
      ...createDataGridLocationStockColumns<
        OfferVariantRow,
        CreateOfferFormValues
      >({
        stockLocations,
        getFieldName: (context, index) => {
          const location = stockLocations[index];
          if (!location) return null;
          return `variants.${context.row.index}.inventory.${location.id}`;
        },
        t,
      }),
      ...createDataGridPriceColumns<OfferVariantRow, CreateOfferFormValues>({
        currencies,
        pricePreferences,
        getFieldName: (context, value) => {
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${context.row.index}.prices.${value}`;
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
