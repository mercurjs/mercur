import { ReactNode, Children } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { useLinkQuery, WidgetZone } from "@mercurjs/dashboard-shared";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { useInventoryItem } from "../../../hooks/api";
import { useReservationItem } from "../../../hooks/api/reservations";

import { ReservationGeneralSection } from "./components/reservation-general-section";
import { ReservationInventorySection } from "./components/reservation-inventory-section";
import { reservationItemLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof reservationItemLoader>
  >;

  const { reservation, isLoading, isError, error } = useReservationItem(
    id!,
    useLinkQuery("reservation"),
    {
      initialData,
    },
  );

  // TEMP: fetch directly since the fields are not populated with reservation call
  const { inventory_item } = useInventoryItem(
    reservation?.inventory_item?.id!,
    useLinkQuery("inventory_item"),
    { enabled: !!reservation?.inventory_item?.id },
  );

  if (isLoading || !reservation) {
    return (
      <TwoColumnPageSkeleton
        mainSections={1}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    );
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage
      data={reservation}
      showJSON
      showMetadata
      data-testid="reservation-detail-page"
    >
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage
      data={reservation}
      showJSON
      showMetadata
      data-testid="reservation-detail-page"
    >
      <TwoColumnPage.Main>
        <WidgetZone id="reservation.detail.main" data={reservation}>
          <ReservationGeneralSection reservation={reservation} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="reservation.detail.side" data={reservation}>
          {inventory_item && (
            <ReservationInventorySection inventoryItem={inventory_item} />
          )}
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const ReservationDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: ReservationGeneralSection,
  SidebarInventorySection: ReservationInventorySection,
});
