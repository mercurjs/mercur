import { SingleColumnPage } from "@components/layout/pages";
import { ShippingProfileListTable } from "./_components/shipping-profile-list-table";

const ShippingProfileList = () => {
  return (
    <SingleColumnPage>
      <ShippingProfileListTable />
    </SingleColumnPage>
  );
};

export const Component = ShippingProfileList;
