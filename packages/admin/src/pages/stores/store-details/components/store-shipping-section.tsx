import { Buildings, CurrencyDollar, PencilSquare, Shopping } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading, Text } from "@medusajs/ui";
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../components/common/action-menu";
import { SidebarLink } from "../../../../components/common/sidebar-link/sidebar-link";
import { _DataTable } from "../../../../components/table/data-table";
import { MoneyAmountCell } from "../../../../components/table/table-cells/common/money-amount-cell";
import {
  TextCell,
  TextHeader,
} from "../../../../components/table/table-cells/common/text-cell";
import { useShippingOptions } from "../../../../hooks/api/shipping-options";
import { useStockLocations } from "../../../../hooks/api/stock-locations";
import { useShippingOptionTableQuery } from "../../../../hooks/table/query/use-shipping-option-table-query";
import { useDataTable } from "../../../../hooks/use-data-table";
import { getCountryByIso2 } from "../../../../lib/data/countries";
import { formatProvider } from "../../../../lib/format-provider";

const PAGE_SIZE = 10;
const PREFIX = "store-shipping";
const SHIPPING_OPTION_FIELDS =
  "+service_zone.name,+service_zone.fulfillment_set.id,+service_zone.fulfillment_set.location.id,+service_zone.fulfillment_set.location.name,+shipping_profile.name,+type.label,*prices,+provider_id";

type StoreShippingSectionProps = {
  sellerId: string;
};

export const StoreShippingSection = ({ sellerId }: StoreShippingSectionProps) => {
  return (
    <div className="flex flex-col gap-y-3" data-testid="store-shipping-section">
      <StoreShippingOptionsSection sellerId={sellerId} />
      <StoreStockLocationsSection sellerId={sellerId} />
    </div>
  );
};

export const StoreShippingOptionsSection = ({
  sellerId,
}: StoreShippingSectionProps) => {
  const { t } = useTranslation();

  const { searchParams, raw } = useShippingOptionTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { shipping_options, count, isLoading, isError, error } =
    useShippingOptions(
      {
        ...searchParams,
        seller_id: sellerId,
        fields: SHIPPING_OPTION_FIELDS,
      },
      { placeholderData: keepPreviousData },
    );

  const columns = useShippingOptionColumns();

  const { table } = useDataTable({
    data: (shipping_options ?? []) as HttpTypes.AdminShippingOption[],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="store-shipping-options-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="store-shipping-options-heading">
          {t("stores.shipping.shippingOptions.header")}
        </Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        isLoading={isLoading}
        pagination
        search
        queryObject={raw}
        prefix={PREFIX}
        noRecords={{
          title: t("stores.emptyStates.shippingOptions.title"),
          message: t("stores.emptyStates.shippingOptions.message"),
          icon: <Shopping className="text-ui-fg-subtle" />,
        }}
      />
      <DisplayExtensionZone model="seller" zone="shipping" data={sellerId} />
    </Container>
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminShippingOption>();

const getShippingOptionPath = (option: HttpTypes.AdminShippingOption) => {
  const fulfillmentSet = option.service_zone?.fulfillment_set;
  const locationId = fulfillmentSet?.location?.id;

  if (!locationId || !fulfillmentSet?.id || !option.service_zone_id) {
    return null;
  }

  return `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSet.id}/service-zone/${option.service_zone_id}/shipping-option/${option.id}`;
};

const useShippingOptionColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => <TextHeader text={t("fields.name")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.display({
        id: "stock_location",
        header: () => (
          <TextHeader text={t("stores.shipping.columns.stockLocation")} />
        ),
        cell: ({ row }) => (
          <TextCell
            text={row.original.service_zone?.fulfillment_set?.location?.name}
          />
        ),
      }),
      columnHelper.display({
        id: "service_zone",
        header: () => (
          <TextHeader text={t("stores.shipping.columns.serviceZone")} />
        ),
        cell: ({ row }) => <TextCell text={row.original.service_zone?.name} />,
      }),
      columnHelper.display({
        id: "shipping_profile",
        header: () => (
          <TextHeader text={t("stores.shipping.columns.shippingProfile")} />
        ),
        cell: ({ row }) => (
          <TextCell text={row.original.shipping_profile?.name} />
        ),
      }),
      columnHelper.accessor("provider_id", {
        header: () => (
          <TextHeader text={t("stores.shipping.columns.provider")} />
        ),
        cell: ({ getValue }) => {
          const providerId = getValue();

          return <TextCell text={providerId ? formatProvider(providerId) : undefined} />;
        },
      }),
      columnHelper.display({
        id: "price",
        header: () => <TextHeader text={t("stores.shipping.columns.price")} />,
        cell: ({ row }) => {
          const price = row.original.prices?.[0];

          if (!price) {
            return <TextCell />;
          }

          return (
            <MoneyAmountCell
              currencyCode={price.currency_code}
              amount={price.amount}
            />
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const path = getShippingOptionPath(row.original);

          if (!path) {
            return null;
          }

          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      label: t("actions.edit"),
                      icon: <PencilSquare />,
                      to: `${path}/edit`,
                      permission: "shipping_options:edit",
                    },
                    {
                      label: t("stores.shipping.actions.editPrices"),
                      icon: <CurrencyDollar />,
                      to: `${path}/pricing`,
                      permission: "shipping_options:edit",
                    },
                  ],
                },
              ]}
              data-testid={`store-shipping-option-actions-${row.original.id}`}
            />
          );
        },
      }),
    ],
    [t],
  );
};

export const StoreStockLocationsSection = ({
  sellerId,
}: StoreShippingSectionProps) => {
  const { t } = useTranslation();

  const { stock_locations, isLoading, isError, error } = useStockLocations({
    seller_id: sellerId,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="p-0" data-testid="store-stock-locations-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="store-stock-locations-heading">
          {t("stores.shipping.stockLocations.header")}
        </Heading>
      </div>
      {!isLoading && !stock_locations?.length && (
        <div className="px-6 pb-4">
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle"
            data-testid="store-stock-locations-empty"
          >
            {t("stores.emptyStates.stockLocations.title")}
          </Text>
        </div>
      )}
      {stock_locations?.map((location) => (
        <SidebarLink
          key={location.id}
          to={`/settings/locations/${location.id}`}
          labelKey={location.name}
          descriptionKey={formatLocationAddress(location)}
          icon={<Buildings />}
          dataTestid={`store-stock-location-link-${location.id}`}
        />
      ))}
    </Container>
  );
};

const formatLocationAddress = (location: HttpTypes.AdminStockLocation) => {
  const address = location.address;

  if (!address) {
    return "-";
  }

  const country = address.country_code
    ? getCountryByIso2(address.country_code)?.display_name ??
      address.country_code.toUpperCase()
    : undefined;

  return [address.city, country].filter(Boolean).join(", ") || "-";
};
