import "@mercurjs/vendor/extension-targets"
import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import { SellerDTO } from "@mercurjs/types"

import StoreSetup from "../components/store-setup/store-setup"

export const config = defineWidgetConfig({
  zone: "store.setup.before",
})

const StoreSetupWidget = ({ data }: { data?: SellerDTO }) => {
  if (!data) {
    return null
  }

  return <StoreSetup seller={data} />
}

export default StoreSetupWidget
