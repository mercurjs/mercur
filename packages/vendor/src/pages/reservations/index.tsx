// Route: /reservations
import { SingleColumnPage } from "@components/layout/pages";
import { ReservationListTable } from "./_components/reservation-list-table";

export const Component = () => {
  return (
    <SingleColumnPage>
      <ReservationListTable />
    </SingleColumnPage>
  );
};
