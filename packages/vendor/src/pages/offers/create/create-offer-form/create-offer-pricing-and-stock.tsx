import { Divider } from "@medusajs/ui"

import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { CreateOfferFormValues } from "./schema"
import { InventoryItemsRepeater } from "./inventory-items-repeater"
import { PricesRepeater } from "./prices-repeater"

const Root = () => (
  <div
    className="flex flex-col items-center p-16"
    data-testid="offer-create-tab-pricingAndStock"
  >
    <div className="flex w-full max-w-[720px] flex-col gap-y-8">
      <PricesRepeater />
      <Divider />
      <InventoryItemsRepeater />
    </div>
  </div>
)

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "pricingAndStock",
  labelKey: "offers.create.tabs.pricingAndStock",
  validationFields: ["prices", "inventory_items"],
})

export const CreateOfferPricingAndStockTab = Root
