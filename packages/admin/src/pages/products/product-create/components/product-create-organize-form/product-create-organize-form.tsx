import { StackedFocusModal } from "../../../../../components/modals";
import { defineTabMeta } from "../../../../../components/tabbed-form/types";
import { ProductCreateSchemaType } from "../../types";
import { ProductCreateOrganizationSection } from "./components/product-create-organize-section";
import { ProductCreateSalesChannelStackedModal } from "./components/product-create-sales-channel-stacked-modal";
import { SC_STACKED_MODAL_ID } from "./constants";

const Root = () => {
  return (
    <StackedFocusModal id={SC_STACKED_MODAL_ID}>
      <div
        className="flex flex-col items-center p-16"
        data-testid="product-create-organize-form"
      >
        <div
          className="flex w-full max-w-[720px] flex-col gap-y-8"
          data-testid="product-create-organize-form-content"
        >
          <ProductCreateOrganizationSection />
        </div>
      </div>
      <ProductCreateSalesChannelStackedModal />
    </StackedFocusModal>
  );
};

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "organize",
  labelKey: "products.create.tabs.organize",
  validationFields: [
    "type_id", "collection_id", "categories", "tags", "sales_channels",
    "shipping_profile_id", "origin_country", "material",
    "width", "length", "height", "weight", "mid_code", "hs_code",
  ],
});

export const ProductCreateOrganizeForm = Root;
