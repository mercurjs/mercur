import { defineTabMeta } from "../../../../../components/tabbed-form/types";
import { ProductCreateSchemaType } from "../../types";
import { ProductCreateOrganizationSection } from "./components/product-create-organize-section";

const Root = () => {
  return (
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
  );
};

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "organize",
  labelKey: "products.create.tabs.organize",
  validationFields: [
    "type_id", "collection_id", "category_id", "seller_id", "tags",
    "origin_country", "material",
    "width", "length", "height", "weight", "mid_code", "hs_code",
  ],
});

export const ProductCreateOrganizeForm = Root;
