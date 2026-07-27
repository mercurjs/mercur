import { SellerDTO } from "@mercurjs/types";

import StoreSetup from "../components/store-setup/store-setup";

const StoreSetupWidget = ({ data }: { data?: SellerDTO }) => {
  if (!data) {
    return null;
  }

  return <StoreSetup seller={data} />;
};

export default StoreSetupWidget;
