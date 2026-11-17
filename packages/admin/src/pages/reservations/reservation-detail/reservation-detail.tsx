import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
  useCan,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { useInventoryItem } from "../../../hooks/api";
import { useReservationItem } from "../../../hooks/api/reservations";

import { ReservationGeneralSection } from "./components/reservation-general-section";
import { ReservationInventorySection } from "./components/reservation-inventory-section";
import { reservationItemLoader } from "./loader";

export const ReservationDetailPage = () => {
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

  const canViewInventoryItems = useCan("inventory_items");

  // TEMP: fetch directly since the fields are not populated with reservation call
  const { inventory_item } = useInventoryItem(
    reservation?.inventory_item?.id!,
    useLinkQuery("inventory_item"),
    { enabled: !!reservation?.inventory_item?.id && canViewInventoryItems },
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

  return (
    <LayoutComposer
      widgetsZonePrefix="reservation.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={reservation}
      data-testid="reservation-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="ReservationGeneralSection">
              <ReservationGeneralSection reservation={reservation} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(reservation)}
          </>
        ),
        side: inventory_item && (
          <LayoutComposer.Entry id="ReservationInventorySection">
            <ReservationInventorySection inventoryItem={inventory_item} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
