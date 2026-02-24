import { Children, ReactNode } from "react";

import { StackedFocusModal } from "@components/modals";
import { TabDefinition } from "../types";
import { ProductCreateOrganizationSection } from "./components/product-create-organize-section";
import { ProductCreateAttributeSection } from "./components/product-create-organize-attribute-section";
import { ProductCreateSalesChannelStackedModal } from "./components/product-create-sales-channel-stacked-modal";
import { SC_STACKED_MODAL_ID } from "./constants";

const Root = ({ children }: { children?: ReactNode }) => {
  if (Children.count(children) > 0) {
    return (
      <StackedFocusModal id={SC_STACKED_MODAL_ID}>
        <div className="flex flex-col items-center p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            {children}
          </div>
        </div>
        <ProductCreateSalesChannelStackedModal />
      </StackedFocusModal>
    );
  }

  return (
    <StackedFocusModal id={SC_STACKED_MODAL_ID}>
      <div className="flex flex-col items-center p-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <ProductCreateOrganizationSection />
        </div>
      </div>
      <ProductCreateSalesChannelStackedModal />
    </StackedFocusModal>
  );
};

Root._tabMeta = {
  id: "organize",
  labelKey: "products.create.tabs.organize",
  validationFields: ["discountable", "categories", "tags", "sales_channels"],
} satisfies TabDefinition;

export const ProductCreateOrganizeForm = Object.assign(Root, {
  _tabMeta: Root._tabMeta,
  OrganizationSection: ProductCreateOrganizationSection,
  AttributeSection: ProductCreateAttributeSection,
  SalesChannelModal: ProductCreateSalesChannelStackedModal,
});
