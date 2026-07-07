// Route: /reservations
import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";
import { ReservationListTable } from "./_components/reservation-list-table";

export const Component = () => {
  return (
    <SingleColumnPage>
      <WidgetZone id="reservations.list">
        <ReservationListTable />
      </WidgetZone>
    </SingleColumnPage>
  );
};
