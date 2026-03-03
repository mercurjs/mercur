import { ReactNode } from "react";
import { ShoppingBag, TruckFast } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useStockLocations } from "../../../hooks/api/stock-locations";
import { LOCATION_LIST_FIELDS } from "./constants";
import { useLocationListTableColumns } from "./use-location-list-table-columns";
import { useLocationListTableQuery } from "./use-location-list-table-query";

import { DataTable } from "../../../components/data-table";
import { SidebarLink } from "../../../components/common/sidebar-link/sidebar-link";
import { TwoColumnPage } from "../../../components/layout/pages";
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition";
import { keepPreviousData } from "@tanstack/react-query";

const PAGE_SIZE = 20;
const PREFIX = "loc";

const LocationListContent = () => {
  const { t } = useTranslation();

  const searchParams = useLocationListTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const {
    stock_locations: stockLocations = [],
    count,
    isError,
    error,
    isLoading,
  } = useStockLocations(
    {
      fields: LOCATION_LIST_FIELDS,
      ...(searchParams as Record<string, unknown>),
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const columns = useLocationListTableColumns();

  if (isError) {
    throw error;
  }

  return (
    <Container
      className="flex flex-col divide-y p-0"
      data-testid="location-list-container"
    >
      <DataTable
        data={stockLocations}
        columns={columns}
        rowCount={count}
        pageSize={PAGE_SIZE}
        getRowId={(row) => row.id}
        heading={t("stockLocations.domain")}
        subHeading={t("stockLocations.list.description")}
        emptyState={{
          empty: {
            heading: t("stockLocations.list.noRecordsMessage"),
            description: t("stockLocations.list.noRecordsMessageEmpty"),
          },
          filtered: {
            heading: t("stockLocations.list.noRecordsMessage"),
            description: t("stockLocations.list.noRecordsMessageFiltered"),
          },
        }}
        actions={[
          {
            label: t("actions.create"),
            to: "create",
          },
        ]}
        isLoading={isLoading}
        rowHref={(row) => `/settings/locations/${row.id}`}
        enableSearch={true}
        prefix={PREFIX}
        layout="fill"
        data-testid="location-list-table"
      />
    </Container>
  );
};

const LinksSection = () => {
  const { t } = useTranslation();

  return (
    <Container className="p-0" data-testid="location-list-sidebar">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="location-list-sidebar-header"
      >
        <Heading level="h2" data-testid="location-list-sidebar-heading">
          {t("stockLocations.sidebar.header")}
        </Heading>
      </div>

      <SidebarLink
        to="/settings/locations/shipping-profiles"
        labelKey={t("stockLocations.sidebar.shippingProfiles.label")}
        descriptionKey={t(
          "stockLocations.sidebar.shippingProfiles.description",
        )}
        icon={<ShoppingBag />}
        data-testid="location-list-sidebar-shipping-profiles-link"
      />
      <SidebarLink
        to="/settings/locations/shipping-option-types"
        labelKey={t("stockLocations.sidebar.shippingOptionTypes.label")}
        descriptionKey={t(
          "stockLocations.sidebar.shippingOptionTypes.description",
        )}
        icon={<TruckFast />}
        data-testid="location-list-sidebar-shipping-option-types-link"
      />
    </Container>
  );
};

const ALLOWED_TYPES = [TwoColumnPage.Main, TwoColumnPage.Sidebar, LocationListContent, LinksSection] as const

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <TwoColumnPage showJSON>
      {hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
        children
      ) : (
        <>
          <TwoColumnPage.Main>
            <LocationListContent />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <LinksSection />
          </TwoColumnPage.Sidebar>
        </>
      )}
    </TwoColumnPage>
  );
};

export const LocationListPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  Content: LocationListContent,
  LinksSection,
});
