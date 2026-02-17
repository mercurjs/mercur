import { ShoppingBag } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link";
import { TwoColumnPage } from "@components/layout/pages";
import { useStockLocations } from "@hooks/api/stock-locations";

import LocationListItem from "./_components/location-list-item";
import { LocationListHeader } from "./_components/location-list-header";
import { LOCATION_LIST_FIELDS } from "./constants";
import { shippingListLoader } from "./loader";

const LinksSection = () => {
  const { t } = useTranslation();

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("stockLocations.sidebar.header")}</Heading>
      </div>

      <SidebarLink
        to="/settings/locations/shipping-profiles"
        labelKey={t("stockLocations.sidebar.shippingProfiles.label")}
        descriptionKey={t(
          "stockLocations.sidebar.shippingProfiles.description",
        )}
        icon={<ShoppingBag />}
      />
    </Container>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingListLoader>
  >;

  const {
    stock_locations: stockLocations = [],
    isError,
    error,
  } = useStockLocations(
    {
      fields: LOCATION_LIST_FIELDS,
    },
    // @ts-expect-error
    { initialData },
  );

  if (isError) {
    throw error;
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage>
          <TwoColumnPage.Main>
            <LocationListHeader />
            <div className="flex flex-col gap-3 lg:col-span-2">
              {stockLocations.map((location) => (
                <LocationListItem key={location.id} location={location} />
              ))}
            </div>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <LinksSection />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const LocationListPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  Header: LocationListHeader,
  ListItem: LocationListItem,
  SidebarLinksSection: LinksSection,
});
