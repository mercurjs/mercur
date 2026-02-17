import { SingleColumnPage } from "@components/layout/pages";
import { OrderListTable } from "./_components/order-list-table";

export const Component = () => {
  return (
    <SingleColumnPage hasOutlet={false}>
      <OrderListTable />
    </SingleColumnPage>
  );
};
